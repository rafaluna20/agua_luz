"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Droplet, Loader2, Printer, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, getStatusColor, translateStatus } from "@/lib/utils";
import { useNotifyError } from "@/lib/stores/uiStore";
import { CLAVE_ESTADO, descargarRecibo } from "@/lib/receipts";
import { receiptDetailService, type ReciboDetalle } from "@/lib/services/receipt-detail.service";

export default function ReciboDetallePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const notifyError = useNotifyError();
  const [detalle, setDetalle] = useState<ReciboDetalle | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setDetalle(await receiptDetailService.getDetail(Number(params.id)));
    } catch (error) {
      console.error("Error cargando el recibo:", error);
      setDetalle(null);
      notifyError("No se pudo cargar el recibo", error instanceof Error ? error.message : "Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }, [params.id, notifyError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const descargar = async () => {
    if (!detalle) return;
    try {
      await descargarRecibo(detalle.recibo);
    } catch {
      notifyError("No se pudo descargar el recibo", "Intenta de nuevo en unos minutos.");
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Cargando recibo...
      </div>
    );
  }

  if (!detalle) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/recibos")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a mis recibos
        </Button>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-700 font-medium">No encontramos este recibo.</p>
            <p className="text-sm text-gray-500 mt-1">Puede que no exista o que no pertenezca a tu cuenta.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { recibo, cliente, medidor, lecturas, tarifa, unidad } = detalle;
  const esAgua = recibo.servicio === "Agua";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.push("/recibos")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
          <Button size="sm" onClick={descargar}>
            <Download className="h-4 w-4 mr-2" /> Descargar PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${esAgua ? "bg-blue-100" : "bg-yellow-100"}`}>
                {esAgua ? <Droplet className="h-6 w-6 text-blue-600" /> : <Zap className="h-6 w-6 text-yellow-600" />}
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{recibo.numero_recibo}</p>
                <p className="text-sm text-gray-600 capitalize">
                  {recibo.servicio} · {recibo.periodo}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                CLAVE_ESTADO[recibo.estado]
              )}`}
            >
              {translateStatus(CLAVE_ESTADO[recibo.estado])}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-4 mt-6 text-sm">
            <div>
              <dt className="text-gray-500">Fecha de emisión</dt>
              <dd className="font-medium text-gray-900">{formatDate(detalle.fechaEmision)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{recibo.estado === "vencido" ? "Venció el" : "Vence el"}</dt>
              <dd className={`font-medium ${recibo.estado === "vencido" ? "text-red-600" : "text-gray-900"}`}>
                {formatDate(recibo.fecha_vencimiento)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-gray-900">{cliente.nombre}</p>
            {cliente.direccion && <p className="text-gray-600">{cliente.direccion}</p>}
            {cliente.telefono && <p className="text-gray-600">{cliente.telefono}</p>}
            <p className="text-gray-600">{cliente.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medidor y lecturas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {medidor && (
              <div className="flex justify-between">
                <span className="text-gray-600">Medidor</span>
                <span className="font-medium">{medidor.codigo}</span>
              </div>
            )}
            {lecturas ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lectura anterior ({formatDate(lecturas.fechaAnterior)})</span>
                  <span className="font-medium">{lecturas.anterior}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lectura actual ({formatDate(lecturas.fechaActual)})</span>
                  <span className="font-medium">{lecturas.actual}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Consumo ({lecturas.dias} días)</span>
                  <span className="font-bold">
                    {lecturas.consumo} {unidad}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-500">El detalle de las lecturas no está disponible para este recibo.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle del cobro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {recibo.consumo !== null && tarifa !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {recibo.consumo} {unidad} × {formatCurrency(tarifa)} por {unidad}
                </span>
                <span className="font-medium">{formatCurrency(recibo.total)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-3 text-base">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">{formatCurrency(recibo.total)}</span>
            </div>
            {recibo.estado !== "pagado" && recibo.saldo !== recibo.total && (
              <div className="flex justify-between text-yellow-700">
                <span>Saldo pendiente</span>
                <span className="font-bold">{formatCurrency(recibo.saldo)}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Conserva este recibo para cualquier consulta o reclamo. Si algo no coincide con tu medidor, comunícate con la
            administración indicando el número de recibo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
