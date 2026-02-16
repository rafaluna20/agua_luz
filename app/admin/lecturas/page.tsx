"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminReadingsService, type AdminReading, type AdminReadingsStats } from "@/lib/services/admin-readings.service";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  Zap,
  Droplet,
  Image as ImageIcon,
  MapPin,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";

// Mock data - en producción vendrá del backend
const mockReadings = [
  {
    id: 1,
    meterCode: "MED-001-A-101",
    meterType: "agua",
    client: "Juan Pérez",
    location: "Torre A - Apto 101",
    readingDate: "2024-02-10",
    previousValue: 1245,
    currentValue: 1380,
    consumption: 135,
    unit: "m³",
    state: "validated",
    readBy: "Carlos Ruiz",
    hasPhoto: true,
    hasGeolocation: true,
    notes: "",
  },
  {
    id: 2,
    meterCode: "MED-001-B-202",
    meterType: "luz",
    client: "María García",
    location: "Torre B - Apto 202",
    readingDate: "2024-02-09",
    previousValue: 2340,
    currentValue: 2680,
    consumption: 340,
    unit: "kWh",
    state: "draft",
    readBy: "Ana López",
    hasPhoto: true,
    hasGeolocation: false,
    notes: "",
  },
  {
    id: 3,
    meterCode: "MED-001-C-303",
    meterType: "agua",
    client: "Pedro Sánchez",
    location: "Torre C - Apto 303",
    readingDate: "2024-02-10",
    previousValue: 890,
    currentValue: 1450,
    consumption: 560,
    unit: "m³",
    state: "anomaly",
    readBy: "Carlos Ruiz",
    hasPhoto: false,
    hasGeolocation: true,
    notes: "Consumo excesivo - posible fuga",
  },
  {
    id: 4,
    meterCode: "MED-001-A-102",
    meterType: "luz",
    client: "Laura Fernández",
    location: "Torre A - Apto 102",
    readingDate: "2024-02-08",
    previousValue: 1567,
    currentValue: 1698,
    consumption: 131,
    unit: "kWh",
    state: "validated",
    readBy: "Ana López",
    hasPhoto: true,
    hasGeolocation: true,
    notes: "",
  },
  {
    id: 5,
    meterCode: "MED-001-B-201",
    meterType: "agua",
    client: "Roberto Díaz",
    location: "Torre B - Apto 201",
    readingDate: "2024-02-10",
    previousValue: 2100,
    currentValue: 2245,
    consumption: 145,
    unit: "m³",
    state: "validated",
    readBy: "Carlos Ruiz",
    hasPhoto: true,
    hasGeolocation: true,
    notes: "",
  },
  {
    id: 6,
    meterCode: "MED-001-D-404",
    meterType: "luz",
    client: "Carmen Vega",
    location: "Torre D - Apto 404",
    readingDate: "2024-02-07",
    previousValue: 3200,
    currentValue: 3180,
    consumption: -20,
    unit: "kWh",
    state: "rejected",
    readBy: "Ana López",
    hasPhoto: false,
    hasGeolocation: false,
    notes: "Lectura menor que anterior - rechazada",
  },
  {
    id: 7,
    meterCode: "MED-002-A-105",
    meterType: "agua",
    client: "José Torres",
    location: "Torre A - Apto 105",
    readingDate: "2024-02-09",
    previousValue: 1678,
    currentValue: 1823,
    consumption: 145,
    unit: "m³",
    state: "draft",
    readBy: "Carlos Ruiz",
    hasPhoto: true,
    hasGeolocation: true,
    notes: "",
  },
];


export default function LecturasPage() {
  // Estados dinámicos
  const [readings, setReadings] = useState<AdminReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<AdminReadingsStats>({
    total: 0,
    validated: 0,
    draft: 0,
    anomaly: 0,
    rejected: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch readings from backend
  const fetchReadings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminReadingsService.getReadings({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        search: searchTerm || undefined,
        state: stateFilter !== 'all' ? stateFilter : undefined,
        service_type: typeFilter === 'agua' ? 'water' : typeFilter === 'luz' ? 'electricity' : undefined,
        date_filter: dateFilter !== 'all' ? dateFilter : undefined,
      });

      setReadings(response.readings);
      setTotal(response.total);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, stateFilter, typeFilter, dateFilter]);

  // Effect para cargar lecturas
  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const handleExport = async () => {
    try {
      const blob = await adminReadingsService.exportReadings({
        search: searchTerm || undefined,
        state: stateFilter !== 'all' ? stateFilter : undefined,
        service_type: typeFilter === 'agua' ? 'water' : typeFilter === 'luz' ? 'electricity' : undefined,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lecturas_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting readings:', error);
      alert('Error al exportar lecturas');
    }
  };

  const handleView = (readingId: number) => {
    console.log("Ver lectura:", readingId);
    // TODO: Implementar modal de detalle
  };

  const handleEdit = (readingId: number) => {
    console.log("Editar lectura:", readingId);
    // TODO: Implementar edición
  };

  const handleValidate = async (readingId: number) => {
    if (!confirm('¿Confirmar validación de esta lectura?')) return;

    try {
      await adminReadingsService.validateReading(readingId);
      // Recargar lecturas
      await fetchReadings();
    } catch (error) {
      console.error('Error validating reading:', error);
      alert('Error al validar lectura');
    }
  };

  const handleReject = async (readingId: number) => {
    const reason = prompt('Motivo del rechazo (opcional):');
    if (reason === null) return; // Usuario canceló

    try {
      await adminReadingsService.rejectReading(readingId, reason || undefined);
      // Recargar lecturas
      await fetchReadings();
    } catch (error) {
      console.error('Error rejecting reading:', error);
      alert('Error al rechazar lectura');
    }
  };

  const handleDelete = (readingId: number) => {
    if (confirm("¿Estás seguro de eliminar esta lectura?")) {
      console.log("Eliminar lectura:", readingId);
      // TODO: Implementar eliminación
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "validated":
        return "text-green-600 bg-green-50 border-green-200";
      case "draft":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "anomaly":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "validated":
        return <CheckCircle className="w-4 h-4" />;
      case "draft":
        return <Clock className="w-4 h-4" />;
      case "anomaly":
        return <AlertTriangle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case "validated":
        return "Validada";
      case "draft":
        return "Borrador";
      case "anomaly":
        return "Anomalía";
      case "rejected":
        return "Rechazada";
      default:
        return "Desconocido";
    }
  };

  const getConsumptionTrend = (consumption: number) => {
    if (consumption > 200) {
      return (
        <span className="flex items-center text-red-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          Alto
        </span>
      );
    } else if (consumption < 0) {
      return (
        <span className="flex items-center text-red-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          Negativo
        </span>
      );
    } else if (consumption < 50) {
      return (
        <span className="flex items-center text-green-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          Bajo
        </span>
      );
    }
    return (
      <span className="flex items-center text-gray-600">
        <TrendingUp className="w-4 h-4 mr-1" />
        Normal
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Lecturas</h1>
          <p className="text-gray-600 mt-1">
            Administra y valida las lecturas de medidores del sistema
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />}>Nueva Lectura</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Validadas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.validated}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Borradores</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.draft}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Anomalías</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.anomaly}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rechazadas</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por medidor, cliente o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                leftIcon={<Filter className="w-4 h-4" />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtros
              </Button>
              <Button
                variant="outline"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExport}
              >
                Exportar
              </Button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="validated">Validadas</option>
                  <option value="draft">Borradores</option>
                  <option value="anomaly">Anomalías</option>
                  <option value="rejected">Rechazadas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Servicio
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="agua">Agua</option>
                  <option value="luz">Luz</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas las fechas</option>
                  <option value="today">Hoy</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mes</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Readings Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medidor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lectura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consumo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tendencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                // Loading skeleton
                Array.from({ length: pageSize }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-28"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                  </tr>
                ))
              ) : (
                readings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {reading.meter_type === "agua" ? (
                          <Droplet className="w-4 h-4 text-blue-600 mr-2" />
                        ) : (
                          <Zap className="w-4 h-4 text-yellow-600 mr-2" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reading.meter_code}
                          </div>
                          <div className="text-xs text-gray-500">{reading.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{reading.client}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{reading.reading_date}</div>
                      <div className="text-xs text-gray-500">Por: {reading.read_by}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {reading.previous_value} → {reading.current_value} {reading.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reading.consumption} {reading.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getConsumptionTrend(reading.consumption)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span title="Tiene foto">
                          {reading.has_photo ? (
                            <ImageIcon className="w-4 h-4 text-green-600" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-gray-300" />
                          )}
                        </span>
                        <span title="Tiene ubicación">
                          {reading.has_geolocation ? (
                            <MapPin className="w-4 h-4 text-green-600" />
                          ) : (
                            <MapPin className="w-4 h-4 text-gray-300" />
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full border ${getStateColor(
                          reading.state
                        )}`}
                      >
                        {getStateIcon(reading.state)}
                        <span className="ml-1">{getStateText(reading.state)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(reading.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {reading.state === "draft" && (
                          <>
                            <button
                              onClick={() => handleValidate(reading.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Validar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(reading.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Rechazar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEdit(reading.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(reading.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && readings.length === 0 && (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay lecturas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron lecturas con los filtros aplicados.
            </p>
          </div>
        )}
      </Card>

      {/* Notes Section for Anomalies */}
      {readings.some((r) => r.notes) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Notas y Observaciones
          </h3>
          <div className="space-y-3">
            {readings
              .filter((r) => r.notes)
              .map((reading) => (
                <div
                  key={reading.id}
                  className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {reading.meter_code} - {reading.client}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{reading.notes}</p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
