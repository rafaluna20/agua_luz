"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, ChevronDown, ChevronRight, Droplet, Loader2, MessageCircle, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useNotifyError, useNotifySuccess } from "@/lib/stores/uiStore";
import {
  delinquentsService,
  type CutAction,
  type Delinquent,
  type DelinquentsSummary,
} from "@/lib/services/delinquents.service";

type Estado = { etiqueta: string; clase: string };

function estadoDe(m: Delinquent): Estado {
  switch (m.order?.state) {
    case "notified":
      return { etiqueta: "Aviso enviado", clase: "bg-blue-50 text-blue-700 border-blue-200" };
    case "approved":
      return { etiqueta: "Corte aprobado", clase: "bg-orange-50 text-orange-700 border-orange-200" };
    case "cut":
      return { etiqueta: "Servicio cortado", clase: "bg-red-50 text-red-700 border-red-200" };
    default:
      return m.apt_for_cut
        ? { etiqueta: "Apto para corte", clase: "bg-red-50 text-red-700 border-red-200" }
        : { etiqueta: "En mora", clase: "bg-yellow-50 text-yellow-700 border-yellow-200" };
  }
}

const CONFIRMACION: Record<Exclude<CutAction, "notify">, { titulo: string; texto: string; boton: string }> = {
  approve: {
    titulo: "Aprobar el corte del servicio",
    texto: "Autoriza cortar el servicio a este cliente. Quedará registrado con su nombre y la fecha.",
    boton: "Aprobar corte",
  },
  cut: {
    titulo: "Registrar el corte ejecutado",
    texto: "Confirme que el servicio ya fue cortado físicamente.",
    boton: "Registrar corte",
  },
  reconnect: {
    titulo: "Registrar la reconexión",
    texto: "Confirme que el servicio fue restablecido (por ejemplo, tras el pago de la deuda).",
    boton: "Registrar reconexión",
  },
  cancel: {
    titulo: "Cancelar la orden de corte",
    texto: "El cliente volverá a la lista sin aviso ni aprobación. Úselo si regularizó su deuda.",
    boton: "Cancelar orden",
  },
};

export default function MorososPage() {
  const notifyError = useNotifyError();
  const notifySuccess = useNotifySuccess();
  const [items, setItems] = useState<Delinquent[]>([]);
  const [resumen, setResumen] = useState<DelinquentsSummary | null>(null);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState<number | null>(null);
  const [trabajando, setTrabajando] = useState<number | null>(null);
  const [pendiente, setPendiente] = useState<{ moroso: Delinquent; accion: Exclude<CutAction, "notify"> } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await delinquentsService.getDelinquents();
      setItems(r.items);
      setResumen(r.summary && "customers" in r.summary ? (r.summary as DelinquentsSummary) : null);
    } catch (error) {
      console.error("Error cargando morosos:", error);
      setItems([]);
      notifyError("No se pudo cargar la lista de morosos", error instanceof Error ? error.message : "Intente de nuevo.");
    } finally {
      setCargando(false);
    }
  }, [notifyError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const ejecutar = async (moroso: Delinquent, accion: CutAction, mensaje: string) => {
    setTrabajando(moroso.partner_id);
    try {
      await delinquentsService.act(moroso.partner_id, accion);
      notifySuccess(mensaje, moroso.name);
      await cargar();
    } catch (error) {
      notifyError("No se pudo completar la acción", error instanceof Error ? error.message : "Intente de nuevo.");
    } finally {
      setTrabajando(null);
      setPendiente(null);
    }
  };

  const puedeGestionar = resumen?.can_manage ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Morosos y cortes</h1>
        <p className="text-gray-600 mt-1">
          Clientes con cobros vencidos. El sistema no corta nada por sí solo: primero se avisa al cliente, luego el
          gerente aprueba el corte y cada paso queda registrado.
        </p>
      </div>

      {resumen && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-600">Clientes en mora</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{resumen.customers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-600">Deuda vencida</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(resumen.total_debt)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-gray-600">Aptos para corte</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{resumen.apt_for_cut}</p>
              <p className="text-xs text-gray-500 mt-1">Desde {resumen.cut_after_days} días de atraso</p>
            </CardContent>
          </Card>
        </div>
      )}

      {cargando && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}

      {!cargando && items.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-700 font-medium">No hay clientes con cobros vencidos.</p>
            <p className="text-sm text-gray-500 mt-1">Todos están al día.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-2 w-6" />
                    <th className="py-2 pr-4">Cliente</th>
                    <th className="py-2 pr-4">Medidores</th>
                    <th className="py-2 pr-4 text-right">Deuda</th>
                    <th className="py-2 pr-4 text-right">Atraso</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => {
                    const estado = estadoDe(m);
                    const expandido = abierto === m.partner_id;
                    const ocupado = trabajando === m.partner_id;
                    const orden = m.order?.state;
                    const aprobableDesde =
                      orden === "notified" && m.order?.notified_date && resumen
                        ? addDays(parseISO(m.order.notified_date.replace(" ", "T") + "Z"), resumen.notice_days)
                        : null;
                    return (
                      <Fragment key={m.partner_id}>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="py-3 pr-2 text-gray-400 cursor-pointer" onClick={() => setAbierto(expandido ? null : m.partner_id)}>
                            {expandido ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-gray-900">{m.name}</p>
                            <p className="text-xs text-gray-500">{m.phone || "Sin teléfono"}</p>
                          </td>
                          <td className="py-3 pr-4 text-xs text-gray-600">{m.meters.join(", ")}</td>
                          <td className="py-3 pr-4 text-right font-semibold">{formatCurrency(m.total_debt)}</td>
                          <td className="py-3 pr-4 text-right">{m.oldest_days_overdue} días</td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${estado.clase}`}>
                              {estado.etiqueta}
                            </span>
                            {aprobableDesde && (
                              <p className="text-[11px] text-gray-500 mt-1">
                                Aprobable desde {format(aprobableDesde, "d 'de' MMM", { locale: es })}
                              </p>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              {m.phone && !["cut", "reconnected"].includes(orden ?? "") && (
                                <a
                                  href={delinquentsService.whatsappLink(
                                    m.phone, m.name, m.total_debt, m.oldest_days_overdue, resumen?.notice_days ?? 3
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 h-8 text-xs rounded-md border border-green-300 text-green-700 hover:bg-green-50"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                </a>
                              )}
                              {!m.order && (
                                <Button size="sm" variant="outline" disabled={ocupado} onClick={() => ejecutar(m, "notify", "Aviso registrado")}>
                                  Registrar aviso
                                </Button>
                              )}
                              {orden === "notified" && puedeGestionar && (
                                <Button size="sm" disabled={ocupado || !m.apt_for_cut} onClick={() => setPendiente({ moroso: m, accion: "approve" })}>
                                  Aprobar corte
                                </Button>
                              )}
                              {orden === "approved" && puedeGestionar && (
                                <Button size="sm" disabled={ocupado} onClick={() => setPendiente({ moroso: m, accion: "cut" })}>
                                  Registrar corte
                                </Button>
                              )}
                              {orden === "cut" && puedeGestionar && (
                                <Button size="sm" disabled={ocupado} onClick={() => setPendiente({ moroso: m, accion: "reconnect" })}>
                                  Reconectar
                                </Button>
                              )}
                              {(orden === "notified" || orden === "approved") && puedeGestionar && (
                                <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => setPendiente({ moroso: m, accion: "cancel" })}>
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandido && (
                          <tr className="bg-gray-50">
                            <td />
                            <td colSpan={6} className="py-3 pr-4">
                              <div className="space-y-1">
                                {m.invoices.map((c) => (
                                  <div key={c.id} className="flex items-center justify-between text-xs border-b border-gray-200 py-1">
                                    <span className="flex items-center gap-2 text-gray-700">
                                      {c.service_type === "water" ? (
                                        <Droplet className="h-3.5 w-3.5 text-blue-600" />
                                      ) : (
                                        <Zap className="h-3.5 w-3.5 text-yellow-600" />
                                      )}
                                      {c.name} · venció {formatDate(c.due_date)}
                                    </span>
                                    <span className="font-medium">
                                      {formatCurrency(c.amount)} · {c.days_overdue} días
                                    </span>
                                  </div>
                                ))}
                                {m.order?.approved_by && (
                                  <p className="text-xs text-gray-500 pt-1">Corte aprobado por {m.order.approved_by}.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!puedeGestionar && resumen && (
              <p className="flex items-center gap-2 text-xs text-gray-500 mt-4">
                <AlertTriangle className="h-4 w-4" /> Su rol permite registrar avisos; aprobar o ejecutar cortes corresponde al gerente.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Modal isOpen={!!pendiente} onClose={() => setPendiente(null)} title={pendiente ? CONFIRMACION[pendiente.accion].titulo : ""}>
        {pendiente && (
          <div className="space-y-4">
            <p className="text-gray-700">
              <strong>{pendiente.moroso.name}</strong> · deuda {formatCurrency(pendiente.moroso.total_debt)} ·{" "}
              {pendiente.moroso.oldest_days_overdue} días de atraso.
            </p>
            <p className="text-sm text-gray-600">{CONFIRMACION[pendiente.accion].texto}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPendiente(null)}>
                Volver
              </Button>
              <Button
                disabled={trabajando === pendiente.moroso.partner_id}
                onClick={() => ejecutar(pendiente.moroso, pendiente.accion, CONFIRMACION[pendiente.accion].boton)}
              >
                {CONFIRMACION[pendiente.accion].boton}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
