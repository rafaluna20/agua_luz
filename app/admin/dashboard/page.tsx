"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  Users,
  Gauge,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

// Mock data
const generateMockData = () => {
  return {
    stats: {
      totalClients: 1250,
      totalMeters: 1890,
      monthlyReadings: 1654,
      monthlyRevenue: 125430.5,
      clientGrowth: 12.5,
      revenueGrowth: 8.3,
      activeAlerts: 3,
    },
    monthlyRevenue: [
      { mes: "Ene", ingresos: 98000 },
      { mes: "Feb", ingresos: 105000 },
      { mes: "Mar", ingresos: 112000 },
      { mes: "Abr", ingresos: 108000 },
      { mes: "May", ingresos: 115000 },
      { mes: "Jun", ingresos: 125430 },
    ],
    serviceDistribution: [
      { name: "Agua", value: 45, color: "#3b82f6" },
      { name: "Luz", value: 55, color: "#eab308" },
    ],
    recentActivity: [
      {
        id: 1,
        type: "reading",
        message: "Nueva lectura registrada - Medidor #12345",
        time: "Hace 5 min",
        icon: BookOpen,
        color: "text-blue-600",
      },
      {
        id: 2,
        type: "client",
        message: "Nuevo cliente registrado - Juan Pérez",
        time: "Hace 15 min",
        icon: Users,
        color: "text-green-600",
      },
      {
        id: 3,
        type: "alert",
        message: "Consumo anormal detectado - Medidor #67890",
        time: "Hace 30 min",
        icon: AlertTriangle,
        color: "text-orange-600",
      },
      {
        id: 4,
        type: "payment",
        message: "Pago recibido - Recibo #R-2024-001",
        time: "Hace 1 hora",
        icon: DollarSign,
        color: "text-green-600",
      },
    ],
    topClients: [
      { name: "Edificio Central", consumption: 15400, revenue: 8500 },
      { name: "Complejo Residencial A", consumption: 12800, revenue: 7200 },
      { name: "Centro Comercial", consumption: 11200, revenue: 6800 },
      { name: "Condominio Las Flores", consumption: 9500, revenue: 5400 },
      { name: "Urbanización Los Pinos", consumption: 8900, revenue: 4900 },
    ],
  };
};

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch real data from API
    setTimeout(() => {
      setData(generateMockData());
      setLoading(false);
    }, 500);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Administrativo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Resumen general del sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Clientes
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {data.stats.totalClients.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">
                +{data.stats.clientGrowth}%
              </span>
              <span className="text-sm text-gray-500">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Medidores Activos
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {data.stats.totalMeters.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Gauge className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-500">
                {data.stats.monthlyReadings} lecturas este mes
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ingresos Mensuales
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  S/ {data.stats.monthlyRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">
                +{data.stats.revenueGrowth}%
              </span>
              <span className="text-sm text-gray-500">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Alertas Activas
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {data.stats.activeAlerts}
                </h3>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                Requieren atención inmediata
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `S/ ${value.toLocaleString()}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Ingresos (S/)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.serviceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.serviceDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {data.serviceDistribution.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes por Consumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topClients.map((client: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {client.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {client.consumption.toLocaleString()} kWh
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      S/ {client.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.map((activity: any) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800`}>
                      <Icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
