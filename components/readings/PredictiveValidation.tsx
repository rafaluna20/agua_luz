"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Info,
} from "lucide-react";

interface MeterHistory {
  last_reading_value: number;
  last_reading_date: string | null;
  average_consumption?: number;
  consumption_trend?: "up" | "down" | "stable";
}

interface ValidationResult {
  isValid: boolean;
  level: "normal" | "warning" | "critical";
  expectedConsumption: number;
  actualConsumption: number;
  variance: number; // Porcentaje
  varianceType: "increase" | "decrease" | "zero" | "negative";
  messages: string[];
  recommendations: string[];
}

interface PredictiveValidationProps {
  currentValue: number;
  meterHistory: MeterHistory;
  onValidationChange?: (result: ValidationResult) => void;
}

export function PredictiveValidation({
  currentValue,
  meterHistory,
  onValidationChange,
}: PredictiveValidationProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  useEffect(() => {
    if (!currentValue || !meterHistory.last_reading_value) {
      setValidation(null);
      return;
    }

    const result = validateReading(currentValue, meterHistory);
    setValidation(result);
    onValidationChange?.(result);
  }, [currentValue, meterHistory, onValidationChange]);

  if (!validation) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Alerta principal */}
      <Alert
        className={`${
          validation.level === "critical"
            ? "bg-red-50 border-red-200"
            : validation.level === "warning"
            ? "bg-yellow-50 border-yellow-200"
            : "bg-green-50 border-green-200"
        }`}
      >
        {validation.level === "critical" && (
          <AlertTriangle className="h-4 w-4 text-red-600" />
        )}
        {validation.level === "warning" && (
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        )}
        {validation.level === "normal" && (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
        <AlertDescription>
          <div className="space-y-1">
            {validation.messages.map((msg, idx) => (
              <p key={idx} className="font-medium">
                {msg}
              </p>
            ))}
          </div>
        </AlertDescription>
      </Alert>

      {/* Detalles de la validación */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Análisis Predictivo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Comparación de consumo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Consumo Esperado</p>
              <p className="text-lg font-semibold">
                {validation.expectedConsumption.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {meterHistory.average_consumption
                  ? `Promedio: ${meterHistory.average_consumption.toFixed(2)}`
                  : "Basado en última lectura"}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Consumo Actual</p>
              <p className="text-lg font-semibold text-blue-600">
                {validation.actualConsumption.toFixed(2)}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                {validation.varianceType === "increase" && (
                  <>
                    <TrendingUp className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-orange-500 font-medium">
                      +{Math.abs(validation.variance).toFixed(1)}%
                    </span>
                  </>
                )}
                {validation.varianceType === "decrease" && (
                  <>
                    <TrendingDown className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-500 font-medium">
                      {validation.variance.toFixed(1)}%
                    </span>
                  </>
                )}
                {validation.varianceType === "zero" && (
                  <Badge variant="secondary" className="text-xs">
                    Sin consumo
                  </Badge>
                )}
                {validation.varianceType === "negative" && (
                  <Badge variant="destructive" className="text-xs">
                    Negativo
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Indicador visual de variación */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Variación</span>
              <span
                className={`font-medium ${
                  validation.level === "critical"
                    ? "text-red-600"
                    : validation.level === "warning"
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {Math.abs(validation.variance).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  validation.level === "critical"
                    ? "bg-red-500"
                    : validation.level === "warning"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{
                  width: `${Math.min(Math.abs(validation.variance), 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Niveles de referencia */}
          <div className="border-t pt-3 space-y-1">
            <div className="flex items-start space-x-2 text-xs">
              <Info className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-600">
                  <span className="font-medium text-green-600">Normal:</span> ±30% de variación
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-yellow-600">Advertencia:</span> ±50% de
                  variación
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-red-600">Crítico:</span> &gt;100% o negativo
                </p>
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          {validation.recommendations.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">Recomendaciones:</p>
              <ul className="space-y-1">
                {validation.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start space-x-2">
                    <span className="text-blue-500 flex-shrink-0">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tendencia histórica */}
          {meterHistory.consumption_trend && (
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">Tendencia:</p>
                <Badge
                  variant={
                    meterHistory.consumption_trend === "up"
                      ? "destructive"
                      : meterHistory.consumption_trend === "down"
                      ? "default"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {meterHistory.consumption_trend === "up" && "Creciente ↑"}
                  {meterHistory.consumption_trend === "down" && "Decreciente ↓"}
                  {meterHistory.consumption_trend === "stable" && "Estable →"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Lógica de validación predictiva
 */
function validateReading(
  currentValue: number,
  meterHistory: MeterHistory
): ValidationResult {
  const lastValue = meterHistory.last_reading_value;
  const actualConsumption = currentValue - lastValue;

  // Caso 1: Consumo negativo (medidor reemplazado o error)
  if (actualConsumption < 0) {
    return {
      isValid: false,
      level: "critical",
      expectedConsumption: meterHistory.average_consumption || 0,
      actualConsumption,
      variance: -100,
      varianceType: "negative",
      messages: [
        "⚠️ CRÍTICO: Lectura menor a la anterior",
        `Anterior: ${lastValue} | Actual: ${currentValue}`,
      ],
      recommendations: [
        "Verificar si el medidor fue reemplazado recientemente",
        "Confirmar que el número de lectura es correcto",
        "Revisar si hay daños en el medidor",
        "Esta lectura requiere aprobación del supervisor",
      ],
    };
  }

  // Caso 2: Consumo cero
  if (actualConsumption === 0) {
    return {
      isValid: true,
      level: "warning",
      expectedConsumption: meterHistory.average_consumption || 10,
      actualConsumption,
      variance: -100,
      varianceType: "zero",
      messages: [
        "⚠️ Consumo cero detectado",
        "El medidor no registra ningún consumo desde la última lectura",
      ],
      recommendations: [
        "Verificar que el medidor esté funcionando correctamente",
        "Confirmar que no hay obstrucciones o daños",
        "Verificar si el cliente está ausente o sin suministro",
        "Puede requerir revisión técnica",
      ],
    };
  }

  // Calcular consumo esperado (promedio o estimación)
  const expectedConsumption = meterHistory.average_consumption || actualConsumption;

  // Calcular variación porcentual
  const variance =
    expectedConsumption > 0 ? ((actualConsumption - expectedConsumption) / expectedConsumption) * 100 : 0;

  const absVariance = Math.abs(variance);

  // Caso 3: Consumo muy alto (>100% del esperado)
  if (absVariance > 100) {
    return {
      isValid: false,
      level: "critical",
      expectedConsumption,
      actualConsumption,
      variance,
      varianceType: variance > 0 ? "increase" : "decrease",
      messages: [
        "⚠️ CRÍTICO: Consumo anormal detectado",
        `Esperado: ~${expectedConsumption.toFixed(2)} | Actual: ${actualConsumption.toFixed(2)}`,
      ],
      recommendations: [
        "Verificar que la lectura sea correcta",
        variance > 0
          ? "Investigar posible fuga o incremento significativo de consumo"
          : "Verificar si hubo un período sin consumo",
        "Revisar instalación del medidor",
        "Requiere validación del supervisor antes de facturar",
      ],
    };
  }

  // Caso 4: Consumo elevado (50-100% del esperado)
  if (absVariance > 50) {
    return {
      isValid: true,
      level: "warning",
      expectedConsumption,
      actualConsumption,
      variance,
      varianceType: variance > 0 ? "increase" : "decrease",
      messages: [
        "⚠️ Consumo fuera del rango habitual",
        `Variación de ${variance.toFixed(1)}% respecto al promedio`,
      ],
      recommendations: [
        "Confirmar que la lectura sea correcta",
        variance > 0
          ? "Informar al cliente sobre el incremento de consumo"
          : "Verificar si hay cambios en el uso del servicio",
        "Puede requerir revisión ligera del supervisor",
      ],
    };
  }

  // Caso 5: Consumo normal (±30% del esperado)
  return {
    isValid: true,
    level: "normal",
    expectedConsumption,
    actualConsumption,
    variance,
    varianceType: variance > 0 ? "increase" : "decrease",
    messages: [
      "✓ Consumo dentro del rango normal",
      `Variación de ${variance >= 0 ? "+" : ""}${variance.toFixed(1)}%`,
    ],
    recommendations: [],
  };
}
