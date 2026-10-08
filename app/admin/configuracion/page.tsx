"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useNotifyError, useNotifySuccess } from "@/lib/stores/uiStore";
import {
  settingsService,
  validarConfiguracion,
  type BillingMode,
  type SettingsForm,
} from "@/lib/services/settings.service";

const CAMPO = "block text-sm font-medium text-gray-700 mb-1";
const AYUDA = "text-xs text-gray-500 mt-1";

export default function ConfiguracionPage() {
  const notifyError = useNotifyError();
  const notifySuccess = useNotifySuccess();
  const [empresa, setEmpresa] = useState("");
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [original, setOriginal] = useState<SettingsForm | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { company_name, ...datos } = await settingsService.get();
      setEmpresa(company_name);
      setForm(datos);
      setOriginal(datos);
    } catch (error) {
      console.error("Error cargando configuración:", error);
      notifyError("No se pudo cargar la configuración", error instanceof Error ? error.message : "Intente de nuevo.");
    } finally {
      setCargando(false);
    }
  }, [notifyError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Cargando configuración...
      </div>
    );
  }

  if (!form || !original) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <p className="text-gray-700 font-medium">No se pudo mostrar la configuración.</p>
          <p className="text-sm text-gray-500 mt-1">Solo el gerente puede verla, y el módulo de cobros debe estar instalado.</p>
          <Button className="mt-4" variant="outline" onClick={cargar}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const cambio = <K extends keyof SettingsForm>(clave: K, valor: SettingsForm[K]) => setForm({ ...form, [clave]: valor });
  const numero = (texto: string) => (texto.trim() === "" ? NaN : Number(texto));
  const sinCambios = JSON.stringify(form) === JSON.stringify(original);

  const guardar = async () => {
    const problema = validarConfiguracion(form);
    if (problema) {
      notifyError("Revise los datos", problema);
      return;
    }
    setGuardando(true);
    try {
      const { company_name, ...guardado } = await settingsService.save(form);
      setEmpresa(company_name);
      setForm(guardado);
      setOriginal(guardado);
      notifySuccess("Configuración guardada", "Los cambios ya están en uso.");
    } catch (error) {
      notifyError("No se pudo guardar", error instanceof Error ? error.message : "Intente de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Cobros, mora y medios de pago de <strong>{empresa}</strong>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cobro de lecturas</CardTitle>
          <CardDescription>Cómo se genera el cobro cuando se valida una lectura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className={CAMPO} htmlFor="modo">Tipo de cobro</label>
            <select
              id="modo"
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.billing_mode}
              onChange={(e) => cambio("billing_mode", e.target.value as BillingMode)}
            >
              <option value="internal">Cobro interno (recibo propio, sin boleta ni factura SUNAT)</option>
              <option value="sunat">Comprobante SUNAT (boleta o factura con IGV)</option>
            </select>
            <p className={AYUDA}>
              El cobro interno es para repartir el costo de un servicio entre usuarios. Si cobra como negocio propio,
              consulte antes con su contador.
            </p>
          </div>

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={form.auto_bill}
                onChange={(e) => cambio("auto_bill", e.target.checked)}
              />
              <span>
                <span className="text-sm font-medium text-gray-900">Cobrar automáticamente al validar la lectura</span>
                <span className={`block ${AYUDA}`}>
                  Cada lectura validada genera y contabiliza el cobro del cliente. Si lo apaga, los cobros se generan a mano.
                </span>
              </span>
            </label>
            {form.auto_bill && form.billing_mode === "sunat" && (
              <div className="flex items-start gap-2 mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Con comprobante SUNAT, cada lectura validada emitirá una boleta o factura. Asegúrese de que es lo que desea.</p>
              </div>
            )}
          </div>

          <div className="max-w-xs">
            <label className={CAMPO} htmlFor="plazo">Plazo de pago (días)</label>
            <Input
              id="plazo"
              type="number"
              min={0}
              max={365}
              value={Number.isNaN(form.invoice_due_days) ? "" : form.invoice_due_days}
              onChange={(e) => cambio("invoice_due_days", numero(e.target.value))}
            />
            <p className={AYUDA}>Días entre la fecha de la lectura y el vencimiento del cobro.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Morosidad y cortes</CardTitle>
          <CardDescription>Cuándo un cliente figura como apto para corte (el gerente siempre lo aprueba)</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={CAMPO} htmlFor="mora">Días de mora para corte</label>
            <Input
              id="mora"
              type="number"
              min={0}
              max={365}
              value={Number.isNaN(form.cut_after_days) ? "" : form.cut_after_days}
              onChange={(e) => cambio("cut_after_days", numero(e.target.value))}
            />
            <p className={AYUDA}>Atraso del cobro vencido más antiguo.</p>
          </div>
          <div>
            <label className={CAMPO} htmlFor="aviso">Días entre aviso y corte</label>
            <Input
              id="aviso"
              type="number"
              min={0}
              max={365}
              value={Number.isNaN(form.cut_notice_days) ? "" : form.cut_notice_days}
              onChange={(e) => cambio("cut_notice_days", numero(e.target.value))}
            />
            <p className={AYUDA}>Tiempo mínimo desde el aviso al cliente para poder aprobar el corte.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cómo pagar</CardTitle>
          <CardDescription>Lo ven los clientes en su pantalla de pagos</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[140px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={"Yape / Plin: 999 999 999 a nombre de ...\nCuenta BCP: ...\nEnvíe su comprobante por WhatsApp indicando su lote."}
            value={form.payment_instructions}
            maxLength={2000}
            onChange={(e) => cambio("payment_instructions", e.target.value)}
          />
          <p className={`${AYUDA} text-right`}>{form.payment_instructions.length}/2000</p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={guardar} disabled={guardando || sinCambios}>
          {guardando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar cambios
        </Button>
        {!sinCambios && (
          <Button variant="outline" onClick={() => setForm(original)} disabled={guardando}>
            Descartar
          </Button>
        )}
      </div>
    </div>
  );
}
