"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { customersService } from "@/lib/services/customers.service";
import { Loader2, Save, X } from "lucide-react";

const customerSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    vat: z.string().optional(),
    email: z.string().email("Email inválido").or(z.literal('')),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state_id: z.string().optional(),
    zip: z.string().optional(),
    country_id: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function CustomerForm({ onSuccess, onCancel }: CustomerFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
    });

    const onSubmit = async (data: CustomerFormData) => {
        setLoading(true);
        setError(null);
        try {
            await customersService.createCustomer(data);
            onSuccess();
        } catch (err: any) {
            console.error("Error creating customer:", err);
            setError(err.message || "Error al crear el cliente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Información Básica */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Información Básica
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre Completo *
                    </label>
                    <Input
                        {...register("name")}
                        placeholder="Ej: Juan Pérez García"
                        className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            DNI/RUC
                        </label>
                        <Input
                            {...register("vat")}
                            placeholder="12345678"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <Input
                            {...register("email")}
                            type="email"
                            placeholder="cliente@ejemplo.com"
                            className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Teléfono
                        </label>
                        <Input
                            {...register("phone")}
                            placeholder="01-234-5678"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Celular
                        </label>
                        <Input
                            {...register("mobile")}
                            placeholder="987-654-321"
                        />
                    </div>
                </div>
            </div>

            {/* Información de Dirección */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Dirección
                </h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Calle/Avenida
                    </label>
                    <Input
                        {...register("street")}
                        placeholder="Av. Principal 123"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ciudad
                        </label>
                        <Input
                            {...register("city")}
                            placeholder="Lima"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Provincia/Estado
                        </label>
                        <Input
                            {...register("state_id")}
                            placeholder="Lima"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Código Postal
                        </label>
                        <Input
                            {...register("zip")}
                            placeholder="15001"
                        />
                    </div>
                </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="default"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cliente
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
