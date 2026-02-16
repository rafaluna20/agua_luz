"use client";

import { useState } from "react";
import { Smartphone, CreditCard, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { MetodoPago } from "@/types";

// Recibos pendientes de ejemplo
const recibosPendientes = [
  {
    id: 1,
    numero_recibo: "REC-2024-001",
    servicio: "Agua",
    periodo: "Enero 2024",
    total: 85.50,
    fecha_vencimiento: "2024-02-15",
    selected: false,
  },
  {
    id: 2,
    numero_recibo: "REC-2024-002",
    servicio: "Luz",
    periodo: "Enero 2024",
    total: 156.80,
    fecha_vencimiento: "2024-02-20",
    selected: false,
  },
];

export default function PagosPage() {
  const [recibosSeleccionados, setRecibosSeleccionados] = useState(recibosPendientes);
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Calcular total seleccionado
  const totalSeleccionado = recibosSeleccionados
    .filter(r => r.selected)
    .reduce((sum, r) => sum + r.total, 0);

  const handleToggleRecibo = (id: number) => {
    setRecibosSeleccionados(prev =>
      prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r)
    );
  };

  const handleSelectAll = () => {
    const allSelected = recibosSeleccionados.every(r => r.selected);
    setRecibosSeleccionados(prev =>
      prev.map(r => ({ ...r, selected: !allSelected }))
    );
  };

  const handlePagar = async () => {
    if (!metodoPago || totalSeleccionado === 0) return;

    setIsProcessing(true);
    
    // Simular proceso de pago
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setPaymentSuccess(true);
  };

  if (paymentSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center py-12">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Pago Exitoso!
            </h2>
            <p className="text-gray-600 mb-6">
              Tu pago de {formatCurrency(totalSeleccionado)} ha sido procesado correctamente
            </p>
            <Button onClick={() => window.location.href = "/dashboard"}>
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
        <p className="text-gray-600 mt-1">
          Selecciona los recibos que deseas pagar y elige tu método de pago preferido
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Selección de recibos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recibos Pendientes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recibos Pendientes</CardTitle>
                  <CardDescription>Selecciona los recibos que deseas pagar</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {recibosSeleccionados.every(r => r.selected) ? "Deseleccionar" : "Seleccionar"} Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recibosSeleccionados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tienes recibos pendientes
                </div>
              ) : (
                <div className="space-y-3">
                  {recibosSeleccionados.map((recibo) => (
                    <label
                      key={recibo.id}
                      className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={recibo.selected}
                        onChange={() => handleToggleRecibo(recibo.id)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{recibo.numero_recibo}</p>
                            <p className="text-sm text-gray-600">
                              {recibo.servicio} • {recibo.periodo}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatCurrency(recibo.total)}</p>
                            <p className="text-xs text-gray-500">
                              Vence: {formatDate(recibo.fecha_vencimiento)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Métodos de Pago */}
          {totalSeleccionado > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Método de Pago</CardTitle>
                <CardDescription>Elige cómo deseas realizar el pago</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Yape */}
                  <button
                    onClick={() => setMetodoPago("yape")}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      metodoPago === "yape"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Smartphone className={`h-8 w-8 mx-auto mb-2 ${
                      metodoPago === "yape" ? "text-blue-600" : "text-gray-600"
                    }`} />
                    <p className="font-medium text-gray-900">Yape</p>
                    <p className="text-xs text-gray-500 mt-1">Pago con QR</p>
                  </button>

                  {/* Tarjeta */}
                  <button
                    onClick={() => setMetodoPago("tarjeta")}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      metodoPago === "tarjeta"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <CreditCard className={`h-8 w-8 mx-auto mb-2 ${
                      metodoPago === "tarjeta" ? "text-blue-600" : "text-gray-600"
                    }`} />
                    <p className="font-medium text-gray-900">Tarjeta</p>
                    <p className="text-xs text-gray-500 mt-1">Débito o Crédito</p>
                  </button>

                  {/* Transferencia */}
                  <button
                    onClick={() => setMetodoPago("transferencia")}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      metodoPago === "transferencia"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Building2 className={`h-8 w-8 mx-auto mb-2 ${
                      metodoPago === "transferencia" ? "text-blue-600" : "text-gray-600"
                    }`} />
                    <p className="font-medium text-gray-900">Transferencia</p>
                    <p className="text-xs text-gray-500 mt-1">Banco</p>
                  </button>
                </div>

                {/* Formulario según método */}
                {metodoPago === "tarjeta" && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Tarjeta
                      </label>
                      <Input placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vencimiento
                        </label>
                        <Input placeholder="MM/AA" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <Input placeholder="123" type="password" maxLength={3} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre en la Tarjeta
                      </label>
                      <Input placeholder="JUAN PEREZ" />
                    </div>
                  </div>
                )}

                {metodoPago === "yape" && (
                  <div className="mt-6 text-center">
                    <div className="bg-gray-100 p-8 rounded-lg">
                      <p className="text-sm text-gray-600 mb-4">
                        Escanea el código QR con tu app Yape
                      </p>
                      <div className="h-48 w-48 bg-white mx-auto flex items-center justify-center border-2 border-gray-300 rounded-lg">
                        <p className="text-gray-400">QR Code</p>
                      </div>
                    </div>
                  </div>
                )}

                {metodoPago === "transferencia" && (
                  <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-blue-900 mb-3">Datos para Transferencia:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Banco:</span>
                        <span className="font-medium text-blue-900">BCP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Cuenta:</span>
                        <span className="font-medium text-blue-900">191-XXXXXXXX-X-XX</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">CCI:</span>
                        <span className="font-medium text-blue-900">002-191-XXXXXXXXXXXXXX-XX</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna derecha - Resumen */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Resumen de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recibosSeleccionados.filter(r => r.selected).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Selecciona los recibos que deseas pagar
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {recibosSeleccionados
                        .filter(r => r.selected)
                        .map(recibo => (
                          <div key={recibo.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{recibo.numero_recibo}</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(recibo.total)}
                            </span>
                          </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between mb-4">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(totalSeleccionado)}
                        </span>
                      </div>

                      {!metodoPago && (
                        <div className="bg-yellow-50 p-3 rounded-lg flex items-start space-x-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-yellow-800">
                            Selecciona un método de pago para continuar
                          </p>
                        </div>
                      )}

                      <Button
                        className="w-full mt-4"
                        size="lg"
                        disabled={!metodoPago || isProcessing}
                        isLoading={isProcessing}
                        onClick={handlePagar}
                      >
                        {isProcessing ? "Procesando..." : "Pagar Ahora"}
                      </Button>

                      <p className="text-xs text-gray-500 text-center mt-3">
                        Pago seguro con encriptación SSL
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
