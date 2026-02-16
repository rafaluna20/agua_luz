"use client";

import { useState } from "react";
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

// Datos de ejemplo
const mockRecibos = [
  {
    id: 1,
    numero_recibo: "REC-2024-001",
    servicio: "Agua",
    periodo: "Enero 2024",
    fecha_emision: "2024-01-05",
    fecha_vencimiento: "2024-02-15",
    lectura_anterior: 150,
    lectura_actual: 168,
    consumo: 18,
    subtotal: 72.50,
    igv: 13.00,
    total: 85.50,
    estado: "pendiente",
  },
  {
    id: 2,
    numero_recibo: "REC-2024-002",
    servicio: "Luz",
    periodo: "Enero 2024",
    fecha_emision: "2024-01-05",
    fecha_vencimiento: "2024-02-20",
    lectura_anterior: 1850,
    lectura_actual: 2095,
    consumo: 245,
    subtotal: 132.50,
    igv: 24.30,
    total: 156.80,
    estado: "pendiente",
  },
  {
    id: 3,
    numero_recibo: "REC-2023-012",
    servicio: "Agua",
    periodo: "Diciembre 2023",
    fecha_emision: "2023-12-05",
    fecha_vencimiento: "2024-01-15",
    lectura_anterior: 135,
    lectura_actual: 150,
    consumo: 15,
    subtotal: 61.20,
    igv: 11.10,
    total: 72.30,
    estado: "pagado",
    fecha_pago: "2024-01-10",
  },
  {
    id: 4,
    numero_recibo: "REC-2023-011",
    servicio: "Luz",
    periodo: "Diciembre 2023",
    fecha_emision: "2023-12-05",
    fecha_vencimiento: "2024-01-20",
    lectura_anterior: 1630,
    lectura_actual: 1850,
    consumo: 220,
    subtotal: 118.00,
    igv: 21.20,
    total: 139.20,
    estado: "pagado",
    fecha_pago: "2024-01-12",
  },
  {
    id: 5,
    numero_recibo: "REC-2023-010",
    servicio: "Agua",
    periodo: "Noviembre 2023",
    fecha_emision: "2023-11-05",
    fecha_vencimiento: "2023-12-15",
    lectura_anterior: 118,
    lectura_actual: 135,
    consumo: 17,
    subtotal: 68.50,
    igv: 12.30,
    total: 80.80,
    estado: "pagado",
    fecha_pago: "2023-12-10",
  },
];

type FilterType = "todos" | "pendiente" | "pagado" | "vencido";

export default function RecibosPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<FilterType>("todos");
  const [filterServicio, setFilterServicio] = useState<string>("todos");

  // Filtrar recibos
  const recibosFiltrados = mockRecibos.filter((recibo) => {
    const matchSearch = 
      recibo.numero_recibo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recibo.periodo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchEstado = filterEstado === "todos" || recibo.estado === filterEstado;
    
    const matchServicio = filterServicio === "todos" || recibo.servicio === filterServicio;

    return matchSearch && matchEstado && matchServicio;
  });

  // Calcular totales
  const totalPendiente = recibosFiltrados
    .filter((r) => r.estado === "pendiente")
    .reduce((sum, r) => sum + r.total, 0);

  const totalPagado = recibosFiltrados
    .filter((r) => r.estado === "pagado")
    .reduce((sum, r) => sum + r.total, 0);

  const handleVerDetalle = (reciboId: number) => {
    router.push(`/recibos/${reciboId}`);
  };

  const handleDescargar = (reciboId: number) => {
    console.log("Descargar recibo:", reciboId);
    // TODO: Implementar descarga real
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
              <p className="text-gray-500">No se encontraron recibos</p>
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(recibo.estado)}`}>
                          {translateStatus(recibo.estado)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {recibo.servicio} • {recibo.periodo}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Consumo: {recibo.consumo} {recibo.servicio === "Agua" ? "m³" : "kWh"}</span>
                        <span>Vence: {formatDate(recibo.fecha_vencimiento)}</span>
                        {recibo.fecha_pago && (
                          <span>Pagado: {formatDate(recibo.fecha_pago)}</span>
                        )}
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
                        onClick={() => handleDescargar(recibo.id)}
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
