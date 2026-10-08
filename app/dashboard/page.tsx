"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  Download,
  Droplet,
  FileText,
  Loader2,
  TrendingDown,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, getStatusColor, translateStatus } from "@/lib/utils";
import { useNotifyError } from "@/lib/stores/uiStore";
import { CLAVE_ESTADO, descargarRecibo, type Recibo } from "@/lib/receipts";
import { dashboardService, type DashboardData, type ServicioResumen } from "@/lib/services/dashboard.service";

function TarjetaServicio({
  titulo,
  unidad,
  datos,
  periodo,
  icono,
  colorIcono,
  fondoIcono,
}: {
  titulo: string;
  unidad: string;
  datos: ServicioResumen;
  periodo: string;
  icono: React.ReactNode;
  colorIcono: string;
  fondoIcono: string;
}) {
  const sube = (datos.cambio ?? 0) > 0;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${fondoIcono} ${colorIcono}`}>
              {icono}
            </div>
            <div>
              <CardTitle>{titulo}</CardTitle>
              <CardDescription>Consumo de {periodo}</CardDescription>
            </div>
          </div>
          <span className={`text-2xl font-bold ${datos.estado === "normal" ? "text-green-600" : "text-red-600"}`}>
            {datos.consumoActual} {unidad}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Mes anterior</span>
            <span className="font-medium">
              {datos.consumoAnterior === null ? "—" : `${datos.consumoAnterior} ${unidad}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Cambio</span>
            {datos.cambio === null ? (
              <span className="font-medium text-gray-500">—</span>
            ) : (
              <span className={`flex items-center font-medium ${sube ? "text-red-600" : "text-green-600"}`}>
                {sube ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {Math.abs(datos.cambio).toFixed(1)}%
              </span>
            )}
          </div>
          {datos.estado === "alto" && (
            <p className="text-xs text-red-600">
              Tu consumo subió más de 30%. Si no lo esperabas, revisa si hay una fuga.
            </p>
          )}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cobrado en el mes</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(datos.costo)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const notifyError = useNotifyError();
  const [data, setData] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setData(await dashboardService.getDashboard());
    } catch (error) {
      console.error("Error cargando el dashboard:", error);
      setData(null);
      notifyError("No se pudo cargar tu resumen", error instanceof Error ? error.message : "Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }, [notifyError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const descargar = async (recibo: Recibo) => {
    try {
      await descargarRecibo(recibo);
    } catch {
      notifyError("No se pudo descargar el recibo", "Intenta de nuevo en unos minutos.");
    }
  };

  if (cargando && !data) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Cargando tu resumen...
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <p className="text-gray-700 font-medium">No pudimos mostrar tu resumen.</p>
          <Button className="mt-4" variant="outline" onClick={cargar}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { estadoCuenta, servicios, ultimosRecibos } = data;
  const hayVencidos = estadoCuenta.recibosVencidos > 0;
  const periodo = data.periodo ? format(parseISO(`${data.periodo}-01`), "MMMM yyyy", { locale: es }) : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">¡Bienvenido, {data.nombre}!</h1>
        <p className="text-gray-600 mt-1">
          {periodo ? (
            <>
              Aquí está el resumen de tus servicios de <span className="capitalize">{periodo}</span>
            </>
          ) : (
            "Aquí verás el resumen de tus servicios cuando tengas lecturas registradas."
          )}
        </p>
      </div>

      {estadoCuenta.totalPendiente > 0 && (
        <Card className={`border-l-4 ${hayVencidos ? "border-l-red-500 bg-red-50" : "border-l-yellow-500 bg-yellow-50"}`}>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className={`h-6 w-6 mt-0.5 ${hayVencidos ? "text-red-600" : "text-yellow-600"}`} />
              <div className="flex-1">
                <h3 className={`font-semibold ${hayVencidos ? "text-red-900" : "text-yellow-900"}`}>
                  {hayVencidos
                    ? `Tienes ${estadoCuenta.recibosVencidos} recibo(s) vencido(s)`
                    : "Tienes recibos pendientes de pago"}
                </h3>
                <p className={`text-sm mt-1 ${hayVencidos ? "text-red-800" : "text-yellow-800"}`}>
                  Total a pagar: <span className="font-bold">{formatCurrency(estadoCuenta.totalPendiente)}</span>
                  {estadoCuenta.proximoVencimiento && (
                    <>
                      {" • "}
                      {hayVencidos ? "Venció" : "Próximo vencimiento"}: {formatDate(estadoCuenta.proximoVencimiento)}
                    </>
                  )}
                </p>
                <Button size="sm" className="mt-3" onClick={() => router.push("/recibos")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver mis recibos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {servicios ? (
        <div className="grid md:grid-cols-2 gap-6">
          <TarjetaServicio
            titulo="Agua"
            unidad="m³"
            datos={servicios.agua}
            periodo={periodo}
            icono={<Droplet className="h-6 w-6" />}
            colorIcono="text-blue-600"
            fondoIcono="bg-blue-100"
          />
          <TarjetaServicio
            titulo="Electricidad"
            unidad="kWh"
            datos={servicios.luz}
            periodo={periodo}
            icono={<Zap className="h-6 w-6" />}
            colorIcono="text-yellow-600"
            fondoIcono="bg-yellow-100"
          />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <p className="text-gray-700 font-medium">Aún no hay consumo registrado.</p>
            <p className="text-sm text-gray-500 mt-1">Aparecerá aquí desde la segunda lectura de tu medidor.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Últimos Recibos</CardTitle>
              <CardDescription>Tus recibos más recientes</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/recibos")}>
              Ver Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ultimosRecibos.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Todavía no tienes recibos.</p>
          ) : (
            <div className="space-y-3">
              {ultimosRecibos.map((recibo) => (
                <div
                  key={recibo.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        recibo.servicio === "Agua" ? "bg-blue-100" : "bg-yellow-100"
                      }`}
                    >
                      {recibo.servicio === "Agua" ? (
                        <Droplet className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Zap className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {recibo.servicio} - {recibo.periodo}
                      </p>
                      <p className="text-sm text-gray-500">Vence: {formatDate(recibo.fecha_vencimiento)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(recibo.total)}</p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          CLAVE_ESTADO[recibo.estado]
                        )}`}
                      >
                        {translateStatus(CLAVE_ESTADO[recibo.estado])}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => descargar(recibo)} aria-label="Descargar recibo">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => router.push("/recibos")}
          className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
        >
          <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <p className="text-sm font-medium text-gray-900">Mis Recibos</p>
        </button>
        <button
          onClick={() => router.push("/consumo")}
          className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
        >
          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <p className="text-sm font-medium text-gray-900">Mi Consumo</p>
        </button>
        <button
          onClick={() => router.push("/perfil")}
          className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
        >
          <User className="h-8 w-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm font-medium text-gray-900">Mi Perfil</p>
        </button>
      </div>
    </div>
  );
}
