"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Share2, Printer, Droplet, Zap, Calendar, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, translateStatus, getStatusColor } from "@/lib/utils";

// Datos de ejemplo del recibo
const mockReciboDetalle = {
  id: 1,
  numero_recibo: "REC-2024-001",
  servicio: "Agua",
  periodo: "Enero 2024",
  fecha_emision: "2024-01-05",
  fecha_vencimiento: "2024-02-15",
  estado: "pendiente",
  
  cliente: {
    nombre: "Juan Pérez García",
    documento: "DNI 12345678",
    direccion: "Av. Los Jardines 123, Mz. A, Lt. 5, San Miguel",
    telefono: "987 654 321",
    email: "juan.perez@email.com",
  },
  
  medidor: {
    codigo: "MED-001-2023",
    tipo: "Agua Potable",
    ubicacion: "Mz. A, Lt. 5",
  },
  
  lecturas: {
    anterior: {
      valor: 150,
      fecha: "2023-12-05",
    },
    actual: {
      valor: 168,
      fecha: "2024-01-05",
    },
    consumo: 18,
    unidad: "m³",
  },
  
  detalles: [
    {
      concepto: "Consumo de Agua",
      cantidad: 18,
      precio_unitario: 3.50,
      subtotal: 63.00,
    },
    {
      concepto: "Cargo Fijo",
      cantidad: 1,
      precio_unitario: 9.50,
      subtotal: 9.50,
    },
  ],
  
  subtotal: 72.50,
  igv: 13.00,
  total: 85.50,
  
  observaciones: "Recibo generado automáticamente. Conserve este documento para cualquier reclamo.",
};

export default function ReciboDetallePage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const handleDescargarPDF = () => {
    console.log("Descargar PDF del recibo:", params.id);
    // TODO: Implementar descarga real
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleCompartir = () => {
    if (navigator.share) {
      navigator.share({
        title: `Recibo ${mockReciboDetalle.numero_recibo}`,
        text: `Recibo de ${mockReciboDetalle.servicio} - ${mockReciboDetalle.periodo}`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header con acciones */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a Recibos
        </button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCompartir}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
          <Button variant="outline" size="sm" onClick={handleImprimir}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button size="sm" onClick={handleDescargarPDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Recibo - Vista Principal */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 print:p-6">
          {/* Header del Recibo */}
          <div className="flex items-start justify-between mb-8 print:mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  mockReciboDetalle.servicio === "Agua" ? "bg-blue-100" : "bg-yellow-100"
                }`}>
                  {mockReciboDetalle.servicio === "Agua" ? (
                    <Droplet className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Zap className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Portal de Servicios</h1>
                  <p className="text-sm text-gray-600">Gestión de Agua y Electricidad</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Recibo N°</p>
              <p className="text-xl font-bold text-gray-900">{mockReciboDetalle.numero_recibo}</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(mockReciboDetalle.estado)}`}>
                {translateStatus(mockReciboDetalle.estado)}
              </span>
            </div>
          </div>

          {/* Información del Cliente y Medidor */}
          <div className="grid md:grid-cols-2 gap-6 mb-8 print:mb-6 pb-6 border-b border-gray-200">
            {/* Datos del Cliente */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Datos del Cliente</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <p className="font-medium text-gray-900">{mockReciboDetalle.cliente.nombre}</p>
                </div>
                <div>
                  <span className="text-gray-600">Documento:</span>
                  <p className="font-medium text-gray-900">{mockReciboDetalle.cliente.documento}</p>
                </div>
                <div>
                  <span className="text-gray-600">Dirección:</span>
                  <p className="font-medium text-gray-900">{mockReciboDetalle.cliente.direccion}</p>
                </div>
                <div>
                  <span className="text-gray-600">Teléfono:</span>
                  <p className="font-medium text-gray-900">{mockReciboDetalle.cliente.telefono}</p>
                </div>
              </div>
            </div>

            {/* Datos del Medidor */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Datos del Medidor</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Código:</span>
                  <p className="font-medium text-gray-900">{mockReciboDetalle.medidor.codigo}</p>
                </div>
                <div>
                  <span className="text-gray-600">Tipo:</span>
                  <p className="font-medium text-gray-900">{mockReciboDetalle.medidor.tipo}</p>
                </div>
                <div>
                  <span className="text-gray-600">Ubicación:</span>
                  <p className="font-medium text-gray-900">{mockReciboDetalle.medidor.ubicacion}</p>
                </div>
                <div>
                  <span className="text-gray-600">Periodo:</span>
                  <p className="font-medium text-gray-900">{mockReciboDetalle.periodo}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Lecturas */}
          <div className="mb-8 print:mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Detalle de Consumo</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Lectura Anterior</p>
                <p className="text-2xl font-bold text-gray-900">{mockReciboDetalle.lecturas.anterior.valor}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(mockReciboDetalle.lecturas.anterior.fecha)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Lectura Actual</p>
                <p className="text-2xl font-bold text-gray-900">{mockReciboDetalle.lecturas.actual.valor}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(mockReciboDetalle.lecturas.actual.fecha)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Consumo Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {mockReciboDetalle.lecturas.consumo} {mockReciboDetalle.lecturas.unidad}
                </p>
                <p className="text-xs text-blue-600 mt-1">Este periodo</p>
              </div>
            </div>
          </div>

          {/* Tabla de Detalles */}
          <div className="mb-8 print:mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Detalle de Cargos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Concepto</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Cantidad</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">P. Unitario</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {mockReciboDetalle.detalles.map((detalle, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">{detalle.concepto}</td>
                      <td className="py-3 px-4 text-center text-gray-900">{detalle.cantidad}</td>
                      <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(detalle.precio_unitario)}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(detalle.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totales */}
          <div className="flex justify-end mb-8 print:mb-6">
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(mockReciboDetalle.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IGV (18%):</span>
                <span className="font-medium text-gray-900">{formatCurrency(mockReciboDetalle.igv)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(mockReciboDetalle.total)}</span>
              </div>
            </div>
          </div>

          {/* Información de Pago */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6 print:mb-4">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Fecha de Vencimiento</p>
                <p className="text-sm text-blue-700 mt-1">
                  {formatDate(mockReciboDetalle.fecha_vencimiento)}
                </p>
                {mockReciboDetalle.estado === "pendiente" && (
                  <p className="text-xs text-blue-600 mt-2">
                    Paga antes de la fecha de vencimiento para evitar recargos
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {mockReciboDetalle.observaciones && (
            <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
              <p>{mockReciboDetalle.observaciones}</p>
            </div>
          )}

          {/* Botón de Pago (solo si está pendiente) */}
          {mockReciboDetalle.estado === "pendiente" && (
            <div className="mt-6 print:hidden">
              <Button className="w-full" size="lg">
                Pagar Ahora - {formatCurrency(mockReciboDetalle.total)}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
