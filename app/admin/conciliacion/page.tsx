"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Droplet, Info, Loader2, Zap } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { useNotifyError } from "@/lib/stores/uiStore";
import {
  reconciliationService,
  type AlertLevel,
  type Reconciliation,
} from "@/lib/services/reconciliation.service";

const ESTILO: Record<AlertLevel, { texto: string; fondo: string; borde: string; etiqueta: string }> = {
  green: { texto: "text-green-700", fondo: "bg-green-50", borde: "border-green-200", etiqueta: "Normal" },
  yellow: { texto: "text-yellow-700", fondo: "bg-yellow-50", borde: "border-yellow-200", etiqueta: "Revisar" },
  red: { texto: "text-red-700", fondo: "bg-red-50", borde: "border-red-200", etiqueta: "Crítica" },
};

const mes = (periodo: string) => format(parseISO(`${periodo}-01`), "MMMM yyyy", { locale: es });
const numero = (n: number, decimales = 1) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

function Semaforo({ nivel }: { nivel: AlertLevel }) {
  const e = ESTILO[nivel];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${e.fondo} ${e.texto} ${e.borde}`}
    >
      {e.etiqueta}
    </span>
  );
}

function TarjetaServicio({ item }: { item: Reconciliation }) {
  const e = ESTILO[item.alert_level];
  const Icono = item.service_type === "water" ? Droplet : Zap;
  return (
    <Card className={`border ${e.borde}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${e.fondo}`}>
              <Icono className={`h-5 w-5 ${e.texto}`} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{item.service_type === "water" ? "Agua" : "Luz"}</p>
              <p className="text-xs text-gray-500 capitalize">{mes(item.period)}</p>
            </div>
          </div>
          <Semaforo nivel={item.alert_level} />
        </div>

        <p className={`text-4xl font-bold mt-4 ${e.texto}`}>{numero(item.loss_percentage)}%</p>
        <p className="text-sm text-gray-600">de lo que entró no se cobró a ningún lote</p>

        <dl className="grid grid-cols-3 gap-2 mt-4 text-sm">
          <div>
            <dt className="text-gray-500">Entró</dt>
            <dd className="font-semibold">
              {numero(item.parent_consumption, 0)} {item.unit}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Se cobró</dt>
            <dd className="font-semibold">
              {numero(item.children_total, 0)} {item.unit}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Diferencia</dt>
            <dd className={`font-semibold ${e.texto}`}>
              {numero(item.delta, 0)} {item.unit}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-gray-500 mt-3">
          Equivale a <span className="font-semibold text-gray-700">{formatCurrency(item.loss_amount)}</span> a la
          tarifa interna.
        </p>
      </CardContent>
    </Card>
  );
}

export default function ConciliacionPage() {
  const notifyError = useNotifyError();
  const [items, setItems] = useState<Reconciliation[]>([]);
  const [umbrales, setUmbrales] = useState({ yellow: 3, red: 5 });
  const [cargando, setCargando] = useState(true);
  const [meses, setMeses] = useState(6);
  const [servicio, setServicio] = useState<"all" | "water" | "electricity">("all");
  const [abierto, setAbierto] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await reconciliationService.getReconciliations({
        months: meses,
        service_type: servicio === "all" ? undefined : servicio,
      });
      setItems(respuesta.items);
      setUmbrales(respuesta.thresholds);
    } catch (error) {
      console.error("Error cargando conciliación:", error);
      setItems([]);
      notifyError("No se pudo cargar la conciliación", error instanceof Error ? error.message : "Intente de nuevo.");
    } finally {
      setCargando(false);
    }
  }, [meses, servicio, notifyError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // El periodo más reciente de cada servicio, para las tarjetas.
  const recientes = useMemo(() => {
    const porServicio = new Map<string, Reconciliation>();
    for (const item of items) if (!porServicio.has(item.service_type)) porServicio.set(item.service_type, item);
    return Array.from(porServicio.values());
  }, [items]);

  // Evolución de la pérdida por mes, una línea por servicio.
  const serie = useMemo(() => {
    const porPeriodo = new Map<string, { periodo: string; mes: string; Luz?: number; Agua?: number }>();
    for (const item of [...items].reverse()) {
      const fila = porPeriodo.get(item.period) ?? {
        periodo: item.period,
        mes: format(parseISO(`${item.period}-01`), "MMM", { locale: es }),
      };
      fila[item.service_type === "water" ? "Agua" : "Luz"] = Number(item.loss_percentage.toFixed(1));
      porPeriodo.set(item.period, fila);
    }
    return Array.from(porPeriodo.values());
  }, [items]);

  const enAlerta = items.filter((i) => i.alert_level !== "green").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Conciliación de consumos</h1>
        <p className="text-gray-600 mt-1">
          Compara lo que registra el medidor principal con la suma de los medidores de cada lote. La diferencia son
          pérdidas, fugas, conexiones no autorizadas o áreas comunes: es lo que usted paga y nadie le reembolsa.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={servicio}
          onChange={(e) => setServicio(e.target.value as typeof servicio)}
          aria-label="Servicio"
        >
          <option value="all">Luz y agua</option>
          <option value="electricity">Solo luz</option>
          <option value="water">Solo agua</option>
        </select>
        <select
          className="h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={meses}
          onChange={(e) => setMeses(Number(e.target.value))}
          aria-label="Periodo"
        >
          <option value={3}>Últimos 3 meses</option>
          <option value={6}>Últimos 6 meses</option>
          <option value={12}>Últimos 12 meses</option>
        </select>
        {cargando && <Loader2 className="h-5 w-5 animate-spin text-gray-400 self-center" />}
      </div>

      {!cargando && items.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Aún no hay conciliaciones en este periodo.</p>
            <p className="text-sm text-gray-500 mt-1">
              Se generan cada mes a partir de las lecturas validadas del medidor principal y de los lotes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {enAlerta > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p>
                {enAlerta} de {items.length} conciliaciones superan el {umbrales.yellow}% de pérdida. Revise primero
                las marcadas como <strong>Crítica</strong> (más de {umbrales.red}%): suelen indicar una fuga o un
                consumo sin medidor.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {recientes.map((item) => (
              <TarjetaServicio key={item.id} item={item} />
            ))}
          </div>

          {serie.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Evolución de la pérdida (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={serie} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(valor: number) => `${valor}%`} />
                      <Legend />
                      <ReferenceLine
                        y={umbrales.yellow}
                        stroke="#ca8a04"
                        strokeDasharray="4 4"
                        label={{ value: `${umbrales.yellow}%`, fontSize: 11, fill: "#ca8a04" }}
                      />
                      <ReferenceLine
                        y={umbrales.red}
                        stroke="#dc2626"
                        strokeDasharray="4 4"
                        label={{ value: `${umbrales.red}%`, fontSize: 11, fill: "#dc2626" }}
                      />
                      <Line type="monotone" dataKey="Luz" stroke="#eab308" strokeWidth={2} dot />
                      <Line type="monotone" dataKey="Agua" stroke="#2563eb" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Detalle por mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 pr-2 w-6" />
                      <th className="py-2 pr-4">Mes</th>
                      <th className="py-2 pr-4">Servicio</th>
                      <th className="py-2 pr-4 text-right">Entró</th>
                      <th className="py-2 pr-4 text-right">Se cobró</th>
                      <th className="py-2 pr-4 text-right">Diferencia</th>
                      <th className="py-2 pr-4 text-right">Pérdida</th>
                      <th className="py-2 pr-4 text-right">Valor</th>
                      <th className="py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const expandido = abierto === item.id;
                      return (
                        <Fragment key={item.id}>
                          <tr
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => setAbierto(expandido ? null : item.id)}
                          >
                            <td className="py-2 pr-2 text-gray-400">
                              {expandido ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </td>
                            <td className="py-2 pr-4 capitalize">{mes(item.period)}</td>
                            <td className="py-2 pr-4">{item.service_type === "water" ? "Agua" : "Luz"}</td>
                            <td className="py-2 pr-4 text-right">
                              {numero(item.parent_consumption, 0)} {item.unit}
                            </td>
                            <td className="py-2 pr-4 text-right">
                              {numero(item.children_total, 0)} {item.unit}
                            </td>
                            <td className="py-2 pr-4 text-right">
                              {numero(item.delta, 0)} {item.unit}
                            </td>
                            <td className={`py-2 pr-4 text-right font-semibold ${ESTILO[item.alert_level].texto}`}>
                              {numero(item.loss_percentage)}%
                            </td>
                            <td className="py-2 pr-4 text-right">{formatCurrency(item.loss_amount)}</td>
                            <td className="py-2">
                              <Semaforo nivel={item.alert_level} />
                            </td>
                          </tr>
                          {expandido && (
                            <tr className="bg-gray-50">
                              <td />
                              <td colSpan={8} className="py-3 pr-4">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {item.children_count} lotes, de mayor a menor consumo
                                  {item.provider ? ` · proveedor: ${item.provider}` : ""}
                                </p>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                                  {item.children.map((hijo) => (
                                    <div
                                      key={hijo.meter_code}
                                      className="flex justify-between text-xs border-b border-gray-200 py-1"
                                    >
                                      <span className="text-gray-700">
                                        {hijo.meter_code}
                                        <span className="text-gray-400"> · {hijo.customer}</span>
                                      </span>
                                      <span className="font-medium">
                                        {numero(hijo.consumption, 1)} {item.unit} ({numero(hijo.percentage, 0)}%)
                                      </span>
                                    </div>
                                  ))}
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
              <p className="text-xs text-gray-500 mt-4">
                Normal hasta {umbrales.yellow}%, revisar entre {umbrales.yellow}% y {umbrales.red}%, crítica sobre{" "}
                {umbrales.red}%. El valor se calcula con la tarifa interna que paga cada lote, no con la que le cobra
                el proveedor.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
