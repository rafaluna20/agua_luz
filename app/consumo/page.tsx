"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { consumptionService, type MonthlyConsumption } from "@/lib/services/consumption.service";
import { useNotifyError } from "@/lib/stores/uiStore";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Zap,
  Droplets,
  Activity,
} from "lucide-react";

export default function ConsumoPage() {
  const { user } = useAuthStore();
  const notifyError = useNotifyError();
  const [consumptionData, setConsumptionData] = useState<MonthlyConsumption[]>([]);
  const [cargando, setCargando] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"6m" | "12m">("6m");
  const [selectedService, setSelectedService] = useState<
    "all" | "agua" | "luz"
  >("all");

  useEffect(() => {
    let activo = true;
    consumptionService
      .getMonthly(12)
      .then((datos) => activo && setConsumptionData(datos))
      .catch((error) => {
        console.error("Error cargando consumo:", error);
        notifyError("No se pudo cargar tu consumo", error instanceof Error ? error.message : "Intenta de nuevo.");
      })
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [notifyError]);

  // Calcular estadísticas
  const stats = {
    aguaTotal: consumptionData.reduce((acc, item) => acc + item.agua, 0),
    luzTotal: consumptionData.reduce((acc, item) => acc + item.luz, 0),
    aguaPromedio:
      consumptionData.length > 0
        ? consumptionData.reduce((acc, item) => acc + item.agua, 0) /
          consumptionData.length
        : 0,
    luzPromedio:
      consumptionData.length > 0
        ? consumptionData.reduce((acc, item) => acc + item.luz, 0) /
          consumptionData.length
        : 0,
  };

  // Tendencias (comparación último mes vs promedio)
  const lastMonth = consumptionData[consumptionData.length - 1];
  const aguaTrend =
    lastMonth && stats.aguaPromedio > 0
      ? ((lastMonth.agua - stats.aguaPromedio) / stats.aguaPromedio) * 100
      : 0;
  const luzTrend =
    lastMonth && stats.luzPromedio > 0
      ? ((lastMonth.luz - stats.luzPromedio) / stats.luzPromedio) * 100
      : 0;

  const handleExport = () => {
    const filas = [
      ["Mes", "Agua (m3)", "Luz (kWh)", "Costo agua (S/)", "Costo luz (S/)"],
      ...consumptionData.map((d) => [d.mes, d.agua, d.luz, d.costoAgua, d.costoLuz]),
    ];
    const csv = filas.map((f) => f.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `consumo-historico-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtrar datos según período seleccionado
  const filteredData = consumptionData.slice(
    selectedPeriod === "6m" ? -6 : -12
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Historial de Consumo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analiza tu consumo de agua y luz en el tiempo
          </p>
        </div>
        <Button variant="default" leftIcon={<Download />} onClick={handleExport}>
          Exportar Datos
        </Button>
      </div>

      {!cargando && consumptionData.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <p className="text-gray-700 font-medium">Aún no hay consumo registrado.</p>
            <p className="text-sm text-gray-500 mt-1">
              Aparecerá aquí desde la segunda lectura de tu medidor.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Período:
          </span>
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === "6m" ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedPeriod("6m")}
            >
              6 Meses
            </Button>
            <Button
              variant={selectedPeriod === "12m" ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedPeriod("12m")}
            >
              12 Meses
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Servicio:
          </span>
          <div className="flex gap-2">
            <Button
              variant={selectedService === "all" ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedService("all")}
            >
              Todos
            </Button>
            <Button
              variant={selectedService === "agua" ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedService("agua")}
            >
              Agua
            </Button>
            <Button
              variant={selectedService === "luz" ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedService("luz")}
            >
              Luz
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Agua Total
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.aguaTotal} m³
                </h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1">
              {aguaTrend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  aguaTrend >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {Math.abs(aguaTrend).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500">vs promedio</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Luz Total
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.luzTotal} kWh
                </h3>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1">
              {luzTrend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  luzTrend >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {Math.abs(luzTrend).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500">vs promedio</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Promedio Agua
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.aguaPromedio.toFixed(1)} m³
                </h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Por mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Promedio Luz
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.luzPromedio.toFixed(1)} kWh
                </h3>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Activity className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Por mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Líneas - Consumo en el Tiempo */}
      {(selectedService === "all" || selectedService === "agua") && (
        <Card>
          <CardHeader>
            <CardTitle>Consumo de Agua</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="agua"
                  stroke="#3b82f6"
                  fill="#93c5fd"
                  name="Agua (m³)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {(selectedService === "all" || selectedService === "luz") && (
        <Card>
          <CardHeader>
            <CardTitle>Consumo de Luz</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="luz"
                  stroke="#eab308"
                  fill="#fde047"
                  name="Luz (kWh)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Barras Comparativo */}
      {selectedService === "all" && (
        <Card>
          <CardHeader>
            <CardTitle>Comparación de Consumo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#eab308" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="agua"
                  fill="#3b82f6"
                  name="Agua (m³)"
                />
                <Bar
                  yAxisId="right"
                  dataKey="luz"
                  fill="#eab308"
                  name="Luz (kWh)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Costos */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Costos (S/)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {(selectedService === "all" || selectedService === "agua") && (
                <Line
                  type="monotone"
                  dataKey="costoAgua"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Costo Agua"
                />
              )}
              {(selectedService === "all" || selectedService === "luz") && (
                <Line
                  type="monotone"
                  dataKey="costoLuz"
                  stroke="#eab308"
                  strokeWidth={2}
                  name="Costo Luz"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla de Datos */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Mes
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Agua (m³)
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Costo Agua (S/)
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Luz (kWh)
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Costo Luz (S/)
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total (S/)
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                      {item.mes}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-right">
                      {item.agua}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-right">
                      S/ {item.costoAgua}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-right">
                      {item.luz}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-right">
                      S/ {item.costoLuz}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-semibold text-right">
                      S/{" "}
                      {(
                        parseFloat(item.costoAgua) + parseFloat(item.costoLuz)
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
