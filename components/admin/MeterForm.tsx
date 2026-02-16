"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { metersService } from "@/lib/services/meters.service";
import { Meter, MeterLevel, Customer } from "@/types/meters";
import { Loader2, Search, UserPlus, Check, X, MapPin } from "lucide-react";

const meterSchema = z.object({
    code: z.string().min(3, "El código debe tener al menos 3 caracteres"),
    service_type: z.enum(["electricity", "water"]),
    meter_level_code: z.string().min(1, "El nivel es obligatorio"),
    location: z.string().min(1, "La ubicación es obligatoria"),
    parent_meter_id: z.string().optional(),
    customer_id: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    serial_number: z.string().optional(),
});

type MeterFormData = z.infer<typeof meterSchema>;

interface MeterFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function MeterForm({ onSuccess, onCancel }: MeterFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dynamic Data State
    const [levels, setLevels] = useState<MeterLevel[]>([]);
    const [loadingLevels, setLoadingLevels] = useState(true);

    // Customer Search State
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [showCustomerResults, setShowCustomerResults] = useState(false);
    const customerSearchRef = useRef<HTMLDivElement>(null);

    // Parent Meter Search State
    const [parentMeters, setParentMeters] = useState<Meter[]>([]);
    const [parentSearch, setParentSearch] = useState("");
    const [selectedParentMeter, setSelectedParentMeter] = useState<Meter | null>(null);
    const [isSearchingParent, setIsSearchingParent] = useState(false);
    const [showParentResults, setShowParentResults] = useState(false);
    const parentSearchRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<MeterFormData>({
        resolver: zodResolver(meterSchema),
        defaultValues: {
            service_type: "electricity",
        },
    });

    const levelCode = watch("meter_level_code");
    const selectedLevel = levels.find(l => l.code === levelCode);

    // Fetch Levels on Mount
    useEffect(() => {
        const fetchLevels = async () => {
            try {
                const data = await metersService.getMeterLevels();
                setLevels(data);
                if (data.length > 0) {
                    // Preselect first level if none selected, or specific logic
                    // Don't auto-select to force user choice or use defaultValues if desired
                }
            } catch (err) {
                console.error("Error loading levels:", err);
                setError("Error cargando niveles jerárquicos");
            } finally {
                setLoadingLevels(false);
            }
        };
        fetchLevels();
    }, []);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
                setShowCustomerResults(false);
            }
            if (parentSearchRef.current && !parentSearchRef.current.contains(event.target as Node)) {
                setShowParentResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Customer Search Debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (customerSearch.trim().length > 1 && !selectedCustomer) {
                setIsSearchingCustomer(true);
                try {
                    const results = await metersService.searchCustomers(customerSearch);
                    setCustomers(results);
                    setShowCustomerResults(true);
                } catch (err) {
                    console.error("Error searching customers:", err);
                } finally {
                    setIsSearchingCustomer(false);
                }
            } else if (customerSearch.trim().length <= 1) {
                setCustomers([]);
                setShowCustomerResults(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [customerSearch, selectedCustomer]);

    // Parent Meter Search Debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (parentSearch.trim().length > 1 && !selectedParentMeter) {
                setIsSearchingParent(true);
                try {
                    const results = await metersService.searchParentMeters(parentSearch);
                    setParentMeters(results);
                    setShowParentResults(true);
                } catch (err) {
                    console.error("Error searching parent meters:", err);
                } finally {
                    setIsSearchingParent(false);
                }
            } else if (parentSearch.trim().length <= 1) {
                setParentMeters([]);
                setShowParentResults(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [parentSearch, selectedParentMeter]);

    // Customer Handlers
    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.name);
        setValue("customer_id", customer.id.toString());
        setShowCustomerResults(false);
    };

    const handleClearCustomer = () => {
        setSelectedCustomer(null);
        setCustomerSearch("");
        setValue("customer_id", "");
        setCustomers([]);
    };

    const handleCreateCustomer = async () => {
        if (!customerSearch.trim()) return;
        setLoading(true);
        try {
            const newCustomer = await metersService.createCustomer({
                name: customerSearch,
                // Defaults for quick create
                email: "",
                phone: ""
            });
            handleSelectCustomer(newCustomer);
        } catch (err: any) {
            console.error("Error creating customer:", err);
            setError("Error al crear cliente: " + (err.message || "Desconocido"));
        } finally {
            setLoading(false);
        }
    };

    // Parent Meter Handlers
    const handleSelectParentMeter = (meter: Meter) => {
        setSelectedParentMeter(meter);
        setParentSearch(meter.code);
        setValue("parent_meter_id", meter.id.toString());
        setShowParentResults(false);
    };

    const handleClearParentMeter = () => {
        setSelectedParentMeter(null);
        setParentSearch("");
        setValue("parent_meter_id", "");
        setParentMeters([]);
    };

    const onSubmit = async (data: MeterFormData) => {
        setLoading(true);
        setError(null);
        try {
            await metersService.createMeter({
                ...data,
                parent_meter_id: data.parent_meter_id ? parseInt(data.parent_meter_id) : undefined,
                customer_id: data.customer_id ? parseInt(data.customer_id) : undefined,
            });
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Error al crear el medidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Identificación */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Código del Medidor</label>
                    <Input {...register("code")} placeholder="Ej: MED-LOTE-101" />
                    {errors.code && (
                        <p className="text-sm text-red-500">{errors.code.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Servicio</label>
                    <select
                        {...register("service_type")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="electricity">Electricidad</option>
                        <option value="water">Agua</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Nivel Jerárquico</label>
                    {loadingLevels ? (
                        <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50 text-gray-500 text-sm">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cargando niveles...
                        </div>
                    ) : (
                        <select
                            {...register("meter_level_code")}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Seleccione un nivel</option>
                            {levels.map((lvl) => (
                                <option key={lvl.id} value={lvl.code}>
                                    {lvl.name} ({lvl.code})
                                </option>
                            ))}
                        </select>
                    )}
                    {errors.meter_level_code && (
                        <p className="text-sm text-red-500">{errors.meter_level_code.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Ubicación</label>
                    <Input {...register("location")} placeholder="Ej: Torre A - Piso 1" />
                    {errors.location && (
                        <p className="text-sm text-red-500">{errors.location.message}</p>
                    )}
                </div>

                {/* PARENT METER SEARCH (Replaced Input) */}
                {levelCode && selectedLevel && selectedLevel.code !== 'PRINCIPAL' && (
                    <div className="space-y-2 relative" ref={parentSearchRef}>
                        <label className="text-sm font-medium">Medidor Padre</label>
                        <input type="hidden" {...register("parent_meter_id")} />

                        <div className="relative">
                            <Input
                                value={parentSearch}
                                onChange={(e) => {
                                    setParentSearch(e.target.value);
                                    if (selectedParentMeter) setSelectedParentMeter(null);
                                }}
                                placeholder="Buscar medidor padre (código)..."
                                className={selectedParentMeter ? "pr-10 border-blue-500 text-blue-700 bg-blue-50" : "pr-10"}
                            />
                            <div className="absolute right-3 top-2.5 text-gray-400">
                                {isSearchingParent ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : selectedParentMeter ? (
                                    <Check className="w-4 h-4 text-blue-600" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                            </div>
                            {selectedParentMeter && (
                                <button
                                    type="button"
                                    onClick={handleClearParentMeter}
                                    className="absolute right-8 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Parent Search Results */}
                        {showParentResults && !selectedParentMeter && parentSearch.length > 1 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                {parentMeters?.length > 0 ? (
                                    parentMeters.map((m) => (
                                        <div
                                            key={m.id}
                                            onClick={() => handleSelectParentMeter(m)}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                        >
                                            <div className="font-medium text-gray-900">{m.code}</div>
                                            <div className="text-xs text-gray-500">
                                                {m.level} • {m.service_type_label || m.service_type}
                                                {m.location ? ` • ${m.location}` : ""}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-center text-gray-500">
                                        No se encontraron medidores.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Customer Search - Only for levels that require it, e.g., LOTE, or just always available? 
                    User said "en el campo de los clientes". Usually mostly for end-user meters. 
                    Let's show it if it's LOTE or similar, or just always optional. 
                    For now, show if level is LOTE as per previous logic, or maybe always?
                    Previous logic: level === "LOTE".
                    Let's stick to level === "LOTE" logic for now as primarily Lotes have Customers.
                    Actually user might want it for sections too? Checking code... 
                    In api_portal.py we only assign customer_id if level.code == 'LOTE' (line 1605).
                    So we should only show it for LOTE.
                */}
                {selectedLevel?.code === "LOTE" && (
                    <div className="space-y-2 relative" ref={customerSearchRef}>
                        <label className="text-sm font-medium">Cliente</label>
                        <input type="hidden" {...register("customer_id")} />

                        <div className="relative">
                            <Input
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    if (selectedCustomer) setSelectedCustomer(null); // Reset selection on edit
                                }}
                                placeholder="Buscar cliente..."
                                className={selectedCustomer ? "pr-10 border-green-500 text-green-700 bg-green-50" : "pr-10"}
                            />
                            <div className="absolute right-3 top-2.5 text-gray-400">
                                {isSearchingCustomer ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : selectedCustomer ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                            </div>
                            {selectedCustomer && (
                                <button
                                    type="button"
                                    onClick={handleClearCustomer}
                                    className="absolute right-8 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {showCustomerResults && !selectedCustomer && customerSearch.length > 1 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                {customers.length > 0 ? (
                                    customers.map((c) => (
                                        <div
                                            key={c.id}
                                            onClick={() => handleSelectCustomer(c)}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                        >
                                            <div className="font-medium text-gray-900">{c.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {c.vat ? `DOC: ${c.vat} • ` : ""}
                                                {c.email || "Sin email"}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-center">
                                        <p className="text-gray-500 mb-2">No se encontraron clientes.</p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onClick={handleCreateCustomer}
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Crear "{customerSearch}"
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                        {errors.customer_id && (
                            <p className="text-sm text-red-500">{errors.customer_id.message}</p>
                        )}
                    </div>
                )}

                {/* Datos Técnicos */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Marca</label>
                    <Input {...register("brand")} placeholder="Opcional" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Modelo</label>
                    <Input {...register("model")} placeholder="Opcional" />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Número de Serie</label>
                    <Input {...register("serial_number")} placeholder="Opcional" />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Crear Medidor
                </Button>
            </div>
        </form>
    );
}
