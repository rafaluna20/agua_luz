"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Calendar,
  Filter,
} from "lucide-react";

// Mock data para reportes
const monthlyRevenueData = [
  { month: "Ago", agua: 35000, luz: 48000, total: 83000 },
  { month: "Sep", agua: 38000, luz: 52000, total: 90000 },
  { month: "Oct", agua: 42000, luz: 49000, total: 91000 },
  { month: "Nov", agua: 39000, luz: 54000, total: 93000 },
  { month: "Dic", agua: 45000, luz: 58000, total: 103000 },
  { month: "Ene", agua: 41000, luz: 62000, total: 103000 },
];

const consumptionByLevelData = [
  { name: "Lote", value: 45, count: 120 },
  { name: "Torre", value: 30, count: 15 },
  { name: "Sección", value: 15, count: 8 },
  { name: "Principal", value: 10, count: 3 },
];

const collectionStatusData = [
  { name: "Cobrado", value: 85, amount: 106250 },
  { name: "Pendiente", value: 10, amount: 12500 },
  { name: "Vencido", value: 5, amount: 6250 },
];

const anomaliesData = [
  { month: "Ago", anomalies: 5 },
  { month: "Sep", anomalies: 3 },
  { month: "Oct", anomalies: 8 },
  { month: "Nov", anomalies: 4 },
  { month: "Dic", anomalies: 6 },
  { month: "Ene", anomalies: 2 },
];

const topClientsData = [
  { name: "Torre A", consumption: 2450, revenue: 8500 },
  { name: "Torre B", consumption: 2230, revenue: 7800 },
  { name: "Edificio Central", consumption: 2100, revenue: 7200 },
  { name: "Torre C", consumption: 1980, revenue: 6900 },
  { name: "Edificio Oeste", consumption: 1750, revenue: 6100 },
];

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function ReportesPage() {
  const [reportType, setReportType] = useState("financial");
  const [dateRange, setDateRange] = useState("6months");
  const [serviceType, setServiceType] = useState("all");

  const handleExportReport = (type: string) => {
    console.log(`Exportando reporte: ${type}`);
    // Aquí iría la lógica de exportación
  };

  const handleGenerateReport = () => {
    console.log("Generando reporte personalizado...");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-gray-600 mt-1">
            Analiza el rendimiento y genera reportes personalizados
          </p>
        </div>
        <Button
          leftIcon={<Download className="w-4 h-4" />}
          onClick={() => handleExportReport("general")}
        >
          Exportar Todo
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="financial">Financiero</option>
              <option value="consumption">Consumo</option>
              <option value="collection">Cobranzas</option>
              <option value="anomalies">Anomalías</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de Fechas
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="month">Último mes</option>
              <option value="3months">Últimos 3 meses</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="year">Último año</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Servicio
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="agua">Agua</option>
              <option value="luz">Luz</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={handleGenerateReport}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">S/ 125,430</p>
              <p className="text-sm text-green-600 mt-1">+8.3% vs mes anterior</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Consumo Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">8,945 kWh</p>
              <p className="text-sm text-blue-600 mt-1">+5.2% vs mes anterior</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clientes Activos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">1,250</p>
              <p className="text-sm text-green-600 mt-1">+12 nuevos este mes</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Anomalías</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">2</p>
              <p className="text-sm text-green-600 mt-1">-66% vs mes anterior</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ingresos Mensuales
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Comparación por tipo de servicio
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => handleExportReport("revenue")}
              >
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="agua" fill="#3B82F6" name="Agua" />
                <Bar dataKey="luz" fill="#F59E0B" name="Luz" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Consumption by Level Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Consumo por Nivel Jerárquico
                </h3>
                <p className="text-sm text-gray-600 mt-1">Distribución porcentual</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => handleExportReport("consumption")}
              >
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={consumptionByLevelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {consumptionByLevelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Collection Status Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Estado de Cobranzas
                </h3>
                <p className="text-sm text-gray-600 mt-1">Distribución de pagos</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => handleExportReport("collection")}
              >
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={collectionStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {collectionStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-medium text-gray-900">
                    S/ {item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Anomalies Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Tendencia de Anomalías
                </h3>
                <p className="text-sm text-gray-600 mt-1">Últimos 6 meses</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => handleExportReport("anomalies")}
              >
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={anomaliesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="anomalies"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Anomalías"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Top 5 Clientes por Consumo
              </h3>
              <p className="text-sm text-gray-600 mt-1">Ranking del mes actual</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => handleExportReport("top-clients")}
            >
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ranking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consumo Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingresos Generados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participación
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topClientsData.map((client, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`text-lg font-bold ${
                            index === 0
                              ? "text-yellow-500"
                              : index === 1
                              ? "text-gray-400"
                              : index === 2
                              ? "text-orange-600"
                              : "text-gray-600"
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.consumption.toLocaleString()} kWh
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        S/ {client.revenue.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(client.consumption / topClientsData[0].consumption) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {((client.consumption / topClientsData[0].consumption) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Report Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reportes Predefinidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="justify-start"
            leftIcon={<FileText className="w-5 h-5" />}
            onClick={() => handleExportReport("monthly-summary")}
          >
            Resumen Mensual Completo
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            leftIcon={<FileText className="w-5 h-5" />}
            onClick={() => handleExportReport("billing-details")}
          >
            Detalle de Facturación
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            leftIcon={<FileText className="w-5 h-5" />}
            onClick={() => handleExportReport("consumption-analysis")}
          >
            Análisis de Consumo
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            leftIcon={<FileText className="w-5 h-5" />}
            onClick={() => handleExportReport("collection-report")}
          >
            Reporte de Cobranzas
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            leftIcon={<FileText className="w-5 h-5" />}
            onClick={() => handleExportReport("anomalies-report")}
          >
            Reporte de Anomalías
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            leftIcon={<Calendar className="w-5 h-5" />}
            onClick={() => handleExportReport("annual-report")}
          >
            Reporte Anual
          </Button>
        </div>
      </Card>
    </div>
  );
}
