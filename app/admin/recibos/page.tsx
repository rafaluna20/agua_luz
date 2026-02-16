
"use client";

import { useState, useEffect, useCallback } from "react";
import {
    FileText,
    Search,
    Download,
    Eye,
    Droplet,
    Zap,
    Smartphone,
    Calendar,
    DollarSign,
    AlertCircle,
    CheckCircle
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
    AdminInvoicesService,
    adminInvoicesService,
    AdminInvoice,
    AdminInvoicesStats
} from "@/lib/services/admin-invoices.service";

// --- Components ---

const StatusBadge = ({ state }: { state: string }) => {
    const styles = {
        paid: "bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
        in_payment: "bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        not_paid: "bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        reversed: "bg-gray-100/80 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
        partial: "bg-orange-100/80 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800"
    };

    const labels = {
        paid: "Pagado",
        in_payment: "En Proceso",
        not_paid: "Pendiente",
        reversed: "Reversado",
        partial: "Parcial"
    };

    const key = state as keyof typeof styles;

    return (
        <span className={`px-2.5 py-0.5 inline-flex items-center text-xs font-medium rounded-full border ${styles[key] || styles.not_paid} transition-colors duration-200`}>
            {labels[key] || state}
        </span>
    );
};

const StatCard = ({ title, value, icon: Icon, colorClass, gradient }: { title: string, value: string, icon: any, colorClass: string, gradient: string }) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-gray-800 bg-white border border-gray-100 dark:border-gray-700 group`}>
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 ${colorClass}`}>
            <Icon className="w-16 h-16" />
        </div>
        <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
            <h3 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${gradient}`}>
                {value}
            </h3>
        </div>
    </div>
);

export default function RecibosPage() {
    // State
    const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AdminInvoicesStats>({
        total_invoiced: 0,
        total_pending: 0,
        total_paid: 0
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [paymentState, setPaymentState] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [totalRecords, setTotalRecords] = useState(0);

    // Fetching
    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminInvoicesService.getInvoices({
                limit: pageSize,
                offset: (page - 1) * pageSize,
                search: searchTerm || undefined,
                payment_state: paymentState !== 'all' ? paymentState : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined
            });

            setInvoices(response.invoices);
            setStats(response.stats);
            setTotalRecords(response.total);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, paymentState, dateFrom, dateTo]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchInvoices]);

    // Handlers
    const handleDownloadPdf = async (id: number, name: string) => {
        try {
            const blob = await adminInvoicesService.downloadInvoicePdf(id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name.replace(/\//g, '-')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert("Error al descargar PDF");
        }
    };

    const handleViewReceipt = async (readingId: number) => {
        try {
            const details = await adminInvoicesService.getReceiptDetails(readingId);
            // TODO: Replace with proper Modal
            alert(`Recibo Técnico\nCliente: ${details.customer}\nServicio: ${details.consumption.unit}\nConsumo: ${details.consumption.total}`);
        } catch (error) {
            alert("No se pudo cargar el detalle técnico");
        }
    };

    return (
        <div className="space-y-8 animate-fade-in p-2 md:p-4 max-w-7xl mx-auto">
            {/* Header & Title */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Gestión de Recibos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">
                        Control centralizado de facturación y cobranza.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Facturado"
                    value={`S/ ${stats.total_invoiced.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    colorClass="text-blue-500"
                    gradient="from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
                />
                <StatCard
                    title="Pendiente de Pago"
                    value={`S/ ${stats.total_pending.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                    icon={AlertCircle}
                    colorClass="text-amber-500"
                    gradient="from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400"
                />
                <StatCard
                    title="Recaudado (Efectivo)"
                    value={`S/ ${stats.total_paid.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                    icon={CheckCircle}
                    colorClass="text-emerald-500"
                    gradient="from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400"
                />
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Search */}
                    <div className="md:col-span-5 relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar cliente, N° recibo..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="md:col-span-3">
                        <select
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white appearance-none cursor-pointer"
                            value={paymentState}
                            onChange={(e) => setPaymentState(e.target.value)}
                        >
                            <option value="all">Todos los estados</option>
                            <option value="not_paid">📅 Pendientes</option>
                            <option value="paid">✅ Pagados</option>
                            <option value="in_payment">🔄 En proceso</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div className="md:col-span-4 flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="date"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white dark:[color-scheme:dark]"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="relative flex-1">
                            <input
                                type="date"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white dark:[color-scheme:dark]"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Documento</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Servicio</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                // Skeleton Loader
                                Array.from({ length: pageSize }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                                                <FileText className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No se encontraron recibos</h3>
                                            <p className="mt-1">Intenta ajustar los filtros de búsqueda</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg mr-3 group-hover:scale-105 transition-transform">
                                                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">{inv.name}</span>
                                                    <span className="block text-xs text-gray-500 dark:text-gray-400">{inv.invoice_date}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[180px]" title={inv.partner_name}>
                                                {inv.partner_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {inv.reading ? (
                                                <div className="flex items-center">
                                                    {inv.reading.service_type === 'water' ? (
                                                        <span className="flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-800">
                                                            <Droplet className="h-3 w-3 mr-1.5" />
                                                            Agua
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md border border-amber-100 dark:border-amber-800">
                                                            <Zap className="h-3 w-3 mr-1.5" />
                                                            Luz
                                                        </span>
                                                    )}
                                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-mono">{inv.reading.period}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                                {inv.currency} {inv.amount_total.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge state={inv.payment_state} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {/* Technical Receipt */}
                                                {inv.reading && (
                                                    <button
                                                        onClick={() => handleViewReceipt(inv.reading!.id)}
                                                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors tooltip"
                                                        title="Ver Consumo (Técnico)"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {/* Fiscal Invoice */}
                                                <button
                                                    onClick={() => handleDownloadPdf(inv.id, inv.name)}
                                                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                                    title="Descargar Factura (SUNAT)"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>

                                                {/* WhatsApp */}
                                                <a
                                                    href={`https://wa.me/?text=Hola ${inv.partner_name}, adjuntamos tu recibo ${inv.name} por ${inv.currency}${inv.amount_total}.`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-full transition-colors"
                                                    title="Enviar por WhatsApp"
                                                >
                                                    <Smartphone className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Mostrando <span className="font-semibold text-gray-900 dark:text-white">{(page - 1) * pageSize + 1}</span> - <span className="font-semibold text-gray-900 dark:text-white">{Math.min(page * pageSize, totalRecords)}</span> de <span className="font-semibold text-gray-900 dark:text-white">{totalRecords}</span>
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Anterior
                        </button>
                        <button
                            disabled={page * pageSize >= totalRecords}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
