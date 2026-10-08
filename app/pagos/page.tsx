"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Droplet, Info, Loader2, Wallet, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useNotifyError } from "@/lib/stores/uiStore";
import { aRecibo, type Recibo } from "@/lib/receipts";
import { adminInvoicesService } from "@/lib/services/admin-invoices.service";
import { portalCustomerService, type PaymentInfo } from "@/lib/services/portal-customer.service";

/**
 * Pantalla informativa: muestra lo que se debe y cómo pagarlo. No procesa pagos: la administración registra
 * cada pago al confirmarlo, y entonces el recibo pasa a "Pagado".
 */
export default function PagosPage() {
  const router = useRouter();
  const notifyError = useNotifyError();
  const [pendientes, setPendientes] = useState<Recibo[]>([]);
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [facturas, pago] = await Promise.all([
        adminInvoicesService.getInvoices({ limit: 100 }),
        portalCustomerService.getPaymentInfo(),
      ]);
      const recibos = (facturas.invoices ?? []).map((f) => aRecibo(f));
      setPendientes(
        recibos.filter((r) => r.estado !== "pagado").sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
      );
      setInfo(pago);
    } catch (error) {
      console.error("Error cargando pagos:", error);
      notifyError("No se pudo cargar la información de pagos", error instanceof Error ? error.message : "Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }, [notifyError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const total = Math.round(pendientes.reduce((suma, r) => suma + r.saldo, 0) * 100) / 100;

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
        <p className="text-gray-600 mt-1">Lo que debes y cómo pagarlo</p>
      </div>

      {pendientes.length === 0 ? (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Estás al día</p>
                <p className="text-sm text-green-800">No tienes recibos pendientes de pago.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recibos por pagar</CardTitle>
                <CardDescription>Del más antiguo al más reciente</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total a pagar</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendientes.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center ${
                        r.servicio === "Agua" ? "bg-blue-100" : "bg-yellow-100"
                      }`}
                    >
                      {r.servicio === "Agua" ? (
                        <Droplet className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Zap className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {r.servicio} - {r.periodo}
                      </p>
                      <p className={`text-xs ${r.estado === "vencido" ? "text-red-600 font-medium" : "text-gray-500"}`}>
                        {r.estado === "vencido" ? "Vencido el" : "Vence el"} {formatDate(r.fecha_vencimiento)}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">{formatCurrency(r.saldo)}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/recibos")}>
              Ver detalle de mis recibos
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Cómo pagar</CardTitle>
              {info?.company_name && <CardDescription>{info.company_name}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {info?.instructions ? (
            <p className="whitespace-pre-line text-gray-800 leading-relaxed">{info.instructions}</p>
          ) : (
            <p className="text-gray-600">
              La administración aún no ha publicado los medios de pago. Consúltale directamente cómo pagar tus recibos.
            </p>
          )}
          <div className="flex items-start gap-2 mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Tu pago se refleja cuando la administración lo confirma. Mientras tanto, el recibo seguirá apareciendo
              como pendiente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
