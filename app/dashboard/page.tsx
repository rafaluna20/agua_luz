"use client";

import { useEffect, useState } from "react";
import { 
  Droplet, 
  Zap, 
  FileText, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Download,
  CreditCard
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";

// Datos de ejemplo (luego se obtendrán de la API)
const mockData = {
  servicios: {
    agua: {
      consumoActual: 18.5,
      consumoAnterior: 15.2,
      costo: 85.50,
      estado: "normal",
    },
    luz: {
      consumoActual: 245,
      consumoAnterior: 220,
      costo: 156.80,
      estado: "alto",
    },
  },
  ultimosRecibos: [
    {
      id: 1,
      servicio: "Agua",
      periodo: "2024-01",
      monto: 85.50,
      estado: "pendiente",
      vencimiento: "2024-02-15",
    },
    {
      id: 2,
      servicio: "Luz",
      periodo: "2024-01",
      monto: 156.80,
      estado: "pendiente",
      vencimiento: "2024-02-20",
    },
    {
      id: 3,
      servicio: "Agua",
      periodo: "2023-12",
      monto: 72.30,
      estado: "pagado",
      vencimiento: "2024-01-15",
    },
  ],
  estadoCuenta: {
    totalPendiente: 242.30,
    proximoVencimiento: "2024-02-15",
    recibosVencidos: 0,
  },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(mockData);

  // TODO: Obtener datos reales de la API
  useEffect(() => {
    // Aquí se haría el fetch a la API
    // const fetchData = async () => {
    //   const response = await apiClient.get('/api/portal/dashboard');
    //   setData(response.data);
    // };
    // fetchData();
  }, []);

  const calcularCambio = (actual: number, anterior: number) => {
    const cambio = ((actual - anterior) / anterior) * 100;
    return {
      valor: Math.abs(cambio).toFixed(1),
      tipo: cambio > 0 ? "aumento" : "disminucion",
    };
  };

  const aguaCambio = calcularCambio(
    data.servicios.agua.consumoActual,
    data.servicios.agua.consumoAnterior
  );

  const luzCambio = calcularCambio(
    data.servicios.luz.consumoActual,
    data.servicios.luz.consumoAnterior
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          ¡Bienvenido, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Aquí está el resumen de tus servicios de {new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Estado de Cuenta - Alerta si hay deuda */}
      {data.estadoCuenta.totalPendiente > 0 && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">
                  Tienes recibos pendientes de pago
                </h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Total a pagar: <span className="font-bold">{formatCurrency(data.estadoCuenta.totalPendiente)}</span>
                  {" • "}
                  Próximo vencimiento: {formatDate(data.estadoCuenta.proximoVencimiento)}
                </p>
                <Button size="sm" className="mt-3">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar Ahora
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Servicios - Agua y Luz */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Servicio de Agua */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Droplet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Agua</CardTitle>
                  <CardDescription>Consumo este mes</CardDescription>
                </div>
              </div>
              <span className={`text-2xl font-bold ${
                data.servicios.agua.estado === "normal" 
                  ? "text-green-600" 
                  : "text-red-600"
              }`}>
                {data.servicios.agua.consumoActual} m³
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Mes anterior</span>
                <span className="font-medium">{data.servicios.agua.consumoAnterior} m³</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Cambio</span>
                <span className={`flex items-center font-medium ${
                  aguaCambio.tipo === "aumento" ? "text-red-600" : "text-green-600"
                }`}>
                  {aguaCambio.tipo === "aumento" ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {aguaCambio.valor}%
                </span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Costo estimado</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(data.servicios.agua.costo)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Servicio de Luz */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <CardTitle>Electricidad</CardTitle>
                  <CardDescription>Consumo este mes</CardDescription>
                </div>
              </div>
              <span className={`text-2xl font-bold ${
                data.servicios.luz.estado === "normal" 
                  ? "text-green-600" 
                  : "text-red-600"
              }`}>
                {data.servicios.luz.consumoActual} kWh
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Mes anterior</span>
                <span className="font-medium">{data.servicios.luz.consumoAnterior} kWh</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Cambio</span>
                <span className={`flex items-center font-medium ${
                  luzCambio.tipo === "aumento" ? "text-red-600" : "text-green-600"
                }`}>
                  {luzCambio.tipo === "aumento" ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {luzCambio.valor}%
                </span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Costo estimado</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(data.servicios.luz.costo)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimos Recibos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Últimos Recibos</CardTitle>
              <CardDescription>Tus recibos más recientes</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Ver Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.ultimosRecibos.map((recibo) => (
              <div
                key={recibo.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    recibo.servicio === "Agua" 
                      ? "bg-blue-100" 
                      : "bg-yellow-100"
                  }`}>
                    {recibo.servicio === "Agua" ? (
                      <Droplet className={`h-5 w-5 ${
                        recibo.servicio === "Agua" ? "text-blue-600" : "text-yellow-600"
                      }`} />
                    ) : (
                      <Zap className={`h-5 w-5 ${
                        recibo.servicio === "Agua" ? "text-blue-600" : "text-yellow-600"
                      }`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {recibo.servicio} - {recibo.periodo}
                    </p>
                    <p className="text-sm text-gray-500">
                      Vence: {formatDate(recibo.vencimiento)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(recibo.monto)}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      recibo.estado === "pagado"
                        ? "bg-green-100 text-green-800"
                        : recibo.estado === "pendiente"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {recibo.estado === "pagado" ? "Pagado" : 
                       recibo.estado === "pendiente" ? "Pendiente" : "Vencido"}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
          <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <p className="text-sm font-medium text-gray-900">Mis Recibos</p>
        </button>
        <button className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
          <CreditCard className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="text-sm font-medium text-gray-900">Pagar</p>
        </button>
        <button className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <p className="text-sm font-medium text-gray-900">Consumo</p>
        </button>
        <button className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
          <Download className="h-8 w-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm font-medium text-gray-900">Descargar</p>
        </button>
      </div>
    </div>
  );
}
