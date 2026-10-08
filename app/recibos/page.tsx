"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Droplet, 
  Zap, 
  Download, 
  Eye,
  Search,
  Filter,
  Calendar
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDate, getStatusColor, translateStatus } from "@/lib/utils";
import { adminInvoicesService } from "@/lib/services/admin-invoices.service";
import { aRecibo, CLAVE_ESTADO, descargarRecibo, type Recibo } from "@/lib/receipts";
import { useNotifyError } from "@/lib/stores/uiStore";

type FilterType = "todos" | "pendiente" | "pagado" | "vencido";

export default function RecibosPage() {
  const router = useRouter();
  const notifyError = useNotifyError();
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<FilterType>("todos");
  const [filterServicio, setFilterServicio] = useState<string>("todos");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await adminInvoicesService.getInvoices({ limit: 100 });
      setRecibos((respuesta?.invoices ?? []).map((f) => aRecibo(f)));
    } catch (error) {
      console.error("Error cargando recibos:", error);
      setRecibos([]);
      notifyError("No se pudieron cargar tus recibos", error instanceof Error ? error.message : "Intenta de nuevo en unos minutos.");
    } finally {
      setCargando(false);
    }
  }, [notifyError]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Filtrar recibos
  const recibosFiltrados = recibos.filter((recibo) => {
    const matchSearch = 
      recibo.numero_recibo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recibo.periodo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchEstado = filterEstado === "todos" || recibo.estado === filterEstado;
    
    const matchServicio = filterServicio === "todos" || recibo.servicio === filterServicio;

    return matchSearch && matchEstado && matchServicio;
  });

  // Calcular totales (lo vencido también es deuda pendiente)
  const totalPendiente = recibosFiltrados
    .filter((r) => r.estado !== "pagado")
    .reduce((sum, r) => sum + r.total, 0);

  const totalPagado = recibosFiltrados
    .filter((r) => r.estado === "pagado")
    .reduce((sum, r) => sum + r.total, 0);

  const handleVerDetalle = (reciboId: number) => {
    router.push(`/recibos/${reciboId}`);
  };

  const handleDescargar = async (recibo: Recibo) => {
    try {
      await descargarRecibo(recibo);
    } catch {
      notifyError("No se pudo descargar el recibo", "Intenta de nuevo en unos minutos.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Recibos</h1>
        <p className="text-gray-600 mt-1">
          Consulta y descarga tus recibos de agua y luz
        </p>
      </div>

      {/* Resumen */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recibos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {recibosFiltrados.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendiente</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {formatCurrency(totalPendiente)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Droplet className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagado</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(totalPagado)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por número o periodo..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filtro por Estado */}
            <div className="w-full md:w-48">
              <select
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as FilterType)}
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="pagado">Pagados</option>
                <option value="vencido">Vencidos</option>
              </select>
            </div>

            {/* Filtro por Servicio */}
            <div className="w-full md:w-48">
              <select
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterServicio}
                onChange={(e) => setFilterServicio(e.target.value)}
              >
                <option value="todos">Todos los servicios</option>
                <option value="Agua">Agua</option>
                <option value="Luz">Luz</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Recibos */}
      <div className="space-y-4">
        {recibosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-500">{cargando ? "Cargando tus recibos..." : "No se encontraron recibos"}</p>
            </CardContent>
          </Card>
        ) : (
          recibosFiltrados.map((recibo) => (
            <Card key={recibo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Info principal */}
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Icono del servicio */}
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      recibo.servicio === "Agua" ? "bg-blue-100" : "bg-yellow-100"
                    }`}>
                      {recibo.servicio === "Agua" ? (
                        <Droplet className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Zap className="h-6 w-6 text-yellow-600" />
                      )}
                    </div>

                    {/* Detalles */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {recibo.numero_recibo}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(CLAVE_ESTADO[recibo.estado])}`}>
                          {translateStatus(CLAVE_ESTADO[recibo.estado])}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {recibo.servicio} • {recibo.periodo}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {recibo.consumo !== null && (
                          <span>Consumo: {recibo.consumo} {recibo.servicio === "Agua" ? "m³" : "kWh"}</span>
                        )}
                        <span>Vence: {formatDate(recibo.fecha_vencimiento)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Monto y Acciones */}
                  <div className="flex items-center gap-4 md:flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(recibo.total)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerDetalle(recibo.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDescargar(recibo)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
