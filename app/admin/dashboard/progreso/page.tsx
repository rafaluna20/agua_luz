"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Target,
  Activity,
  Award,
  MapPin,
} from "lucide-react";
import { readingsService } from "@/lib/services/readings.service";

interface DashboardStats {
  totalReadings: number;
  todayReadings: number;
  dailyGoal: number;
  completionPercentage: number;
  averagePerHour: number;
  pendingReadings: number;
  validatedReadings: number;
  anomalousReadings: number;
  operators: OperatorStats[];
  recentReadings: RecentReading[];
  hourlyDistribution: HourlyData[];
}

interface OperatorStats {
  id: number;
  name: string;
  readingsCount: number;
  validatedCount: number;
  anomalyCount: number;
  efficiency: number;
  rank: number;
}

interface RecentReading {
  id: string;
  meterCode: string;
  value: number;
  operatorName: string;
  timestamp: string;
  status: "valid" | "pending" | "anomaly";
}

interface HourlyData {
  hour: string;
  count: number;
}

export default function DashboardProgresoPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Verificar autenticación
  useEffect(() => {
    if (!user || !isAdmin()) {
      router.push("/login-admin");
    }
  }, [user, isAdmin, router]);

  // Actualizar reloj
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cargar estadísticas
  useEffect(() => {
    loadDashboardStats();

    // Actualizar cada 30 segundos
    const interval = setInterval(loadDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);

      // Obtener lecturas pendientes de sincronización (offline)
      const pendingReadings = await readingsService.getPendingReadings();

      // Generar datos mock para demostración
      // En producción, estos datos vendrían del backend
      const mockStats: DashboardStats = {
        totalReadings: 847,
        todayReadings: 156,
        dailyGoal: 200,
        completionPercentage: 78,
        averagePerHour: 19.5,
        pendingReadings: pendingReadings.length,
        validatedReadings: 142,
        anomalousReadings: 8,
        operators: [
          {
            id: 1,
            name: "Juan Pérez",
            readingsCount: 68,
            validatedCount: 65,
            anomalyCount: 2,
            efficiency: 96,
            rank: 1,
          },
          {
            id: 2,
            name: "María López",
            readingsCount: 52,
            validatedCount: 49,
            anomalyCount: 3,
            efficiency: 94,
            rank: 2,
          },
          {
            id: 3,
            name: "Carlos Ruiz",
            readingsCount: 36,
            validatedCount: 28,
            anomalyCount: 3,
            efficiency: 78,
            rank: 3,
          },
        ],
        recentReadings: pendingReadings.slice(0, 5).map((r, idx) => ({
          id: r.local_id,
          meterCode: `MED-${r.meter_id}`,
          value: r.value,
          operatorName: r.operator_name,
          timestamp: r.reading_date,
          status: r.validation_status === "valid" ? "valid" : r.validation_status === "anomaly" ? "anomaly" : "pending",
        })),
        hourlyDistribution: [
          { hour: "08:00", count: 12 },
          { hour: "09:00", count: 23 },
          { hour: "10:00", count: 28 },
          { hour: "11:00", count: 31 },
          { hour: "12:00", count: 18 },
          { hour: "13:00", count: 15 },
          { hour: "14:00", count: 22 },
          { hour: "15:00", count: 7 },
        ],
      };

      setStats(mockStats);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !isAdmin()) {
    return null;
  }

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Progreso</h1>
            <p className="text-gray-500 mt-1">
              Monitoreo en tiempo real de lecturas de medidores
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{currentTime.toLocaleTimeString("es-PE")}</div>
            <div className="text-sm text-gray-500">
              {currentTime.toLocaleDateString("es-PE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Lecturas del día */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Lecturas Hoy</p>
                <p className="text-3xl font-bold mt-2">{stats.todayReadings}</p>
                <div className="flex items-center mt-2 text-sm">
                  <Target className="h-4 w-4 mr-1 text-blue-500" />
                  <span className="text-gray-600">
                    Meta: {stats.dailyGoal} ({stats.completionPercentage}%)
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            {/* Barra de progreso */}
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(stats.completionPercentage, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promedio por hora */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Promedio/Hora</p>
                <p className="text-3xl font-bold mt-2">{stats.averagePerHour}</p>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-green-600">Buen ritmo</span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validadas */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Validadas</p>
                <p className="text-3xl font-bold mt-2">{stats.validatedReadings}</p>
                <div className="flex items-center mt-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-gray-600">
                    {((stats.validatedReadings / stats.todayReadings) * 100).toFixed(0)}% del total
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anomalías */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Anomalías</p>
                <p className="text-3xl font-bold mt-2">{stats.anomalousReadings}</p>
                <div className="flex items-center mt-2 text-sm">
                  <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />
                  <span className="text-gray-600">
                    {((stats.anomalousReadings / stats.todayReadings) * 100).toFixed(1)}% del total
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de distribución horaria */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Distribución Horaria</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.hourlyDistribution.map((data) => (
                <div key={data.hour} className="flex items-center space-x-3">
                  <span className="text-sm font-medium w-16">{data.hour}</span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                      style={{
                        width: `${(data.count / Math.max(...stats.hourlyDistribution.map((d) => d.count))) * 100}%`,
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-end pr-3 text-sm font-semibold text-gray-700">
                      {data.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ranking de operarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Ranking de Operarios</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.operators.map((operator) => (
                <div
                  key={operator.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        operator.rank === 1
                          ? "bg-yellow-100 text-yellow-600"
                          : operator.rank === 2
                          ? "bg-gray-200 text-gray-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      #{operator.rank}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{operator.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                      <span>{operator.readingsCount} lecturas</span>
                      <span>•</span>
                      <span className="text-green-600">{operator.efficiency}%</span>
                    </div>
                  </div>
                  {operator.anomalyCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {operator.anomalyCount}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lecturas recientes */}
      {stats.recentReadings.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Últimas Lecturas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentReadings.map((reading) => (
                <div
                  key={reading.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Badge
                      variant={
                        reading.status === "valid"
                          ? "default"
                          : reading.status === "anomaly"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {reading.status === "valid"
                        ? "✓"
                        : reading.status === "anomaly"
                        ? "⚠"
                        : "⏳"}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{reading.meterCode}</p>
                      <p className="text-xs text-gray-500">{reading.operatorName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{reading.value}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(reading.timestamp).toLocaleTimeString("es-PE")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
