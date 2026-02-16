
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MeterForm } from "@/components/admin/MeterForm";
import { metersService } from "@/lib/services/meters.service";
import { Meter } from "@/types/meters";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Edit,
  Trash2,
  QrCode,
  Eye,
  Download,
  Filter,
  Zap,
  Droplet,
  Loader2,
} from "lucide-react";

export default function MedidoresPage() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Stats (derived from current filtered/unfiltered list)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    alerts: 0,
  });

  const fetchMeters = async () => {
    setLoading(true);
    try {
      // Por ahora traemos todo y filtramos en cliente si la lista es pequeña,
      // o usamos los filtros del endpoint si implementamos paginación server-side.
      // Para MVP, traemos lista genérica y filtramos aquí o enviamos params.
      // Enviamos params de búsqueda básica al menos.
      const params: any = { limit: 100 };
      if (typeFilter !== 'all') params.service_type = typeFilter;

      // Si el filtro es 'all', enviamos '' para que el backend no filtre por defecto 'active'
      // Si es otro valor, lo enviamos.
      params.state = statusFilter === 'all' ? '' : statusFilter;

      if (searchTerm) params.search = searchTerm;

      const data = await metersService.getMeters(params);
      setMeters(data.meters);

      // Update stats based on full response count if available, or current list
      setStats({
        total: data.total,
        active: data.meters.filter((m) => m.state === "active").length,
        inactive: data.meters.filter((m) => m.state === "inactive").length,
        alerts: data.meters.filter((m) => m.state === "maintenance").length, // Mapping maintenance to alert for now
      });

    } catch (error) {
      console.error("Error fetching meters:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeters();
  }, [typeFilter, statusFilter]); // Refetch when API filters change

  // Filter logic on client for things not filtered on server (e.g. searching just by code if API supports general search)
  // Si API maneja el search, no necesitamos filtrar de nuevo, pero por seguridad:
  const filteredMeters = meters.filter((meter) => {
    if (searchTerm) { // Si ya filtramos en server, esto es redundante pero harmless
      const lowerTerm = searchTerm.toLowerCase();
      return (
        meter.code.toLowerCase().includes(lowerTerm) ||
        meter.customer_name?.toLowerCase().includes(lowerTerm) ||
        meter.location?.toLowerCase().includes(lowerTerm)
      );
    }
    if (levelFilter !== "all" && meter.meter_level_code !== levelFilter) return false;
    return true;
  });

  const handleExport = () => {
    console.log("Exportar medidores...");
  };

  const handleViewHistory = (meterId: number) => {
    console.log("Ver historial del medidor:", meterId);
  };

  const handleEdit = (meterId: number) => {
    console.log("Editar medidor:", meterId);
  };

  const handleGenerateQR = (meterId: number) => {
    console.log("Generar QR del medidor:", meterId);
  };

  const handleDelete = (meterId: number) => {
    if (confirm("¿Estás seguro de eliminar este medidor?")) {
      console.log("Eliminar medidor:", meterId);
    }
  };

  const handleSuccessCreate = () => {
    setIsModalOpen(false);
    fetchMeters(); // Refresh list
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50 border-green-200";
      case "inactive":
        return "text-gray-600 bg-gray-50 border-gray-200";
      case "maintenance":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "replaced":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "inactive":
        return <XCircle className="w-4 h-4" />;
      case "maintenance":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo";
      case "inactive":
        return "Inactivo";
      case "maintenance":
        return "Mantenimiento";
      case "replaced":
        return "Reemplazado";
      default:
        return status;
    }
  };

  const getLevelColor = (level: string = "") => {
    switch (level.toUpperCase()) {
      case "PRINCIPAL":
        return "bg-purple-100 text-purple-800";
      case "TORRE":
        return "bg-blue-100 text-blue-800";
      case "SECCION":
        return "bg-green-100 text-green-800";
      case "LOTE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Medidores</h1>
          <p className="text-gray-600 mt-1">
            Administra todos los medidores de agua y luz del sistema
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Nuevo Medidor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Medidores</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{stats.inactive}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <XCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Mantenimiento</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.alerts}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
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
                placeholder="Buscar por código, cliente o ubicación..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Debounce fetch could be implemented here
                  if (e.target.value === '') fetchMeters();
                }}
                onKeyDown={(e) => e.key === 'Enter' && fetchMeters()}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel Jerárquico
                </label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los niveles</option>
                  <option value="PRINCIPAL">Principal</option>
                  <option value="TORRE">Torre</option>
                  <option value="SECCION">Sección</option>
                  <option value="LOTE">Lote</option>
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
                  <option value="electricity">Electricidad</option>
                  <option value="water">Agua</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="maintenance">Mantenimiento</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Meters Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nivel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Lectura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hijos
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
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                    <p className="mt-2 text-sm text-gray-500">Cargando medidores...</p>
                  </td>
                </tr>
              ) : filteredMeters.length > 0 ? (
                filteredMeters.map((meter) => (
                  <tr key={meter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{meter.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLevelColor(
                          (meter.meter_level_code || meter.level || "").toUpperCase()
                        )}`}
                      >
                        {meter.level || meter.meter_level_code || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {meter.service_type === "water" ? (
                          <Droplet className="w-4 h-4 text-blue-600 mr-2" />
                        ) : (
                          <Zap className="w-4 h-4 text-yellow-600 mr-2" />
                        )}
                        <span className="text-sm text-gray-900 capitalize">
                          {meter.service_type === 'electricity' ? 'Luz' : 'Agua'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{meter.customer_name || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{meter.location || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{meter.last_reading_date || "-"}</div>
                      <div className="text-xs text-gray-500">{meter.last_reading_value ? `${meter.last_reading_value} ${meter.service_type === 'water' ? 'm³' : 'kWh'}` : ""}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {meter.children && meter.children > 0 ? (
                          <span className="font-medium text-blue-600">{meter.children}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                          meter.state
                        )}`}
                      >
                        {getStatusIcon(meter.state)}
                        <span className="ml-1">{getStatusText(meter.state)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewHistory(meter.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver historial"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleGenerateQR(meter.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Generar QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(meter.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(meter.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <Activity className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay medidores</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No se encontraron medidores con los filtros aplicados.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Medidor"
      >
        <MeterForm
          onSuccess={handleSuccessCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
