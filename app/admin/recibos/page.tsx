
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    CheckCircle,
    QrCode,
    MoreVertical,
    X,
    TrendingUp,
    TrendingDown,
    Minus,
    Loader2,
    ArrowRight,
    Gauge,
    Receipt
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
    AdminInvoicesService,
    adminInvoicesService,
    AdminInvoice,
    AdminInvoicesStats,
    AdminReceiptDetails
} from "@/lib/services/admin-invoices.service";

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

const StatusBadge = ({ state }: { state: string }) => {
    const styles: Record<string, string> = {
        paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        in_payment: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        not_paid: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        reversed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
        partial: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800"
    };

    const labels: Record<string, string> = {
        paid: "Pagado",
        in_payment: "En Proceso",
        not_paid: "Pendiente",
        reversed: "Reversado",
        partial: "Parcial"
    };

    const icons: Record<string, string> = {
        paid: "✓",
        in_payment: "⟳",
        not_paid: "⏳",
        reversed: "↩",
        partial: "½"
    };

    return (
        <span className={`px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full border ${styles[state] || styles.not_paid} transition-colors duration-200`}>
            <span className="text-[10px]">{icons[state] || "⏳"}</span>
            {labels[state] || state}
        </span>
    );
};

const StatCard = ({ title, value, icon: Icon, colorClass, gradient }: { title: string; value: string; icon: any; colorClass: string; gradient: string }) => (
    <div className="relative overflow-hidden rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 dark:bg-gray-800 bg-white border border-gray-100 dark:border-gray-700 group">
        <div className={`absolute -top-2 -right-2 p-4 opacity-[0.07] group-hover:scale-110 group-hover:opacity-[0.12] transition-all duration-500 ${colorClass}`}>
            <Icon className="w-20 h-20" />
        </div>
        <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
            <h3 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${gradient}`}>
                {value}
            </h3>
        </div>
    </div>
);

// ============================================================
// ACTIONS DROPDOWN MENU
// ============================================================

const ActionsDropdown = ({
    invoice,
    onViewConsumption,
    onDownloadSunat,
    onDownloadReceipt,
    whatsappHref,
    isDownloading,
}: {
    invoice: AdminInvoice;
    onViewConsumption: () => void;
    onDownloadSunat: () => void;
    onDownloadReceipt: () => void;
    whatsappHref: string;
    isDownloading: string | null;
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div className="flex items-center justify-end gap-1.5">
            {/* PRIMARY ACTION: Download SUNAT PDF (always visible) */}
            <button
                onClick={onDownloadSunat}
                disabled={isDownloading === 'sunat'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
                title={`Descargar ${invoice.document_type || 'Comprobante'} SUNAT`}
            >
                {isDownloading === 'sunat' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Download className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{invoice.document_type || 'PDF'}</span>
            </button>

            {/* SECONDARY ACTIONS: Dropdown "⋮" */}
            <div ref={ref} className="relative">
                <button
                    onClick={() => setOpen(!open)}
                    className={`p-1.5 rounded-lg border transition-all duration-200 ${open
                        ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                        : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                        } text-gray-500 dark:text-gray-400`}
                    title="Más acciones"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>

                {open && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        {/* View Consumption detail */}
                        {invoice.reading && (
                            <button
                                onClick={() => { onViewConsumption(); setOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                    <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="text-left">
                                    <div className="font-medium">Ver detalle de consumo</div>
                                    <div className="text-xs text-gray-400">{invoice.reading.period} — {invoice.reading.consumption} {invoice.reading.service_type === 'water' ? 'm³' : 'kWh'}</div>
                                </div>
                            </button>
                        )}

                        {/* Download Detailed Receipt */}
                        {invoice.has_informative_receipt && invoice.receipt_url && (
                            <button
                                onClick={() => { onDownloadReceipt(); setOpen(false); }}
                                disabled={isDownloading === 'receipt'}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                            >
                                <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                                    {isDownloading === 'receipt' ? (
                                        <Loader2 className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-spin" />
                                    ) : (
                                        <Receipt className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    )}
                                </div>
                                <div className="text-left">
                                    <div className="font-medium">Recibo detallado + QR</div>
                                    <div className="text-xs text-gray-400">Con historial de consumo</div>
                                </div>
                            </button>
                        )}

                        {/* Divider */}
                        <div className="my-1.5 border-t border-gray-100 dark:border-gray-700" />

                        {/* WhatsApp */}
                        <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="p-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                <Smartphone className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium">Enviar por WhatsApp</div>
                                <div className="text-xs text-gray-400">
                                    {invoice.partner_phone ? `Al ${invoice.partner_phone}` : 'Sin número registrado'}
                                </div>
                            </div>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================
// CONSUMPTION DETAIL MODAL
// ============================================================

const ConsumptionModal = ({
    open,
    onClose,
    invoice,
    details,
    loading,
    onDownloadReceipt,
}: {
    open: boolean;
    onClose: () => void;
    invoice: AdminInvoice | null;
    details: AdminReceiptDetails | null;
    loading: boolean;
    onDownloadReceipt: () => void;
}) => {
    if (!open || !invoice) return null;

    const isWater = invoice.reading?.service_type === 'water';
    const unit = isWater ? 'm³' : 'kWh';
    const colorClass = isWater ? 'blue' : 'amber';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`px-6 py-4 bg-gradient-to-r ${isWater ? 'from-blue-600 to-cyan-600' : 'from-amber-500 to-orange-500'} text-white`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                {isWater ? <Droplet className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Detalle de Consumo</h3>
                                <p className="text-sm opacity-80">{invoice.reading?.period || invoice.invoice_date}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            <p className="text-sm text-gray-500">Cargando detalle...</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Client info */}
                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-500">
                                    {invoice.partner_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{invoice.partner_name}</div>
                                    <div className="text-xs text-gray-500">{invoice.name}</div>
                                </div>
                            </div>

                            {/* Reading pills */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center">
                                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Lectura Anterior</div>
                                    <div className="text-lg font-bold text-gray-700 dark:text-gray-200">
                                        {details?.readings?.previous ?? '—'}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center">
                                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Lectura Actual</div>
                                    <div className="text-lg font-bold text-gray-700 dark:text-gray-200">
                                        {details?.readings?.current ?? '—'}
                                    </div>
                                </div>
                                <div className={`bg-${colorClass}-50 dark:bg-${colorClass}-900/20 rounded-xl p-3 text-center border border-${colorClass}-200 dark:border-${colorClass}-800`}>
                                    <div className={`text-[10px] font-medium text-${colorClass}-600 dark:text-${colorClass}-400 uppercase tracking-wider mb-1`}>Consumo</div>
                                    <div className={`text-xl font-extrabold text-${colorClass}-700 dark:text-${colorClass}-300`}>
                                        {invoice.reading?.consumption ?? details?.consumption?.total ?? '—'}
                                    </div>
                                    <div className={`text-[10px] text-${colorClass}-500`}>{unit}</div>
                                </div>
                            </div>

                            {/* Mini consumption trend */}
                            {details?.consumption && (
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <Gauge className="w-4 h-4" />
                                        <span>Promedio diario</span>
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {details.consumption.avg_daily?.toFixed(2)} {unit}/día
                                    </span>
                                </div>
                            )}

                            {/* History mini chart */}
                            {details?.history && details.history.length > 0 && (
                                <div>
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Historial Reciente</div>
                                    <div className="flex items-end justify-between gap-1.5 h-20">
                                        {details.history.map((h, i) => {
                                            const max = Math.max(...details.history.map(x => x.consumption), 1);
                                            const heightPct = Math.max((h.consumption / max) * 100, 8);
                                            const isLast = i === details.history.length - 1;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                    <span className="text-[9px] font-medium text-gray-500">{h.consumption}</span>
                                                    <div
                                                        className={`w-full rounded-t-md transition-all ${isLast
                                                            ? `bg-${colorClass}-500`
                                                            : 'bg-gray-200 dark:bg-gray-700'
                                                            }`}
                                                        style={{ height: `${heightPct}%` }}
                                                    />
                                                    <span className={`text-[9px] ${isLast ? `font-bold text-${colorClass}-600` : 'text-gray-400'}`}>
                                                        {h.date?.slice(5, 7) || '—'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Amount + Download */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div>
                                    <div className="text-xs text-gray-400">Total a pagar</div>
                                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                        {invoice.currency} {invoice.amount_total.toFixed(2)}
                                    </div>
                                </div>
                                {invoice.has_informative_receipt && (
                                    <button
                                        onClick={onDownloadReceipt}
                                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${isWater ? 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' : 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'} shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5`}
                                    >
                                        <Download className="w-4 h-4" />
                                        Descargar Recibo
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// ============================================================
// MAIN PAGE
// ============================================================

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
    const [serviceType, setServiceType] = useState<"water" | "electricity" | "all">("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [totalRecords, setTotalRecords] = useState(0);

    // Action states
    const [downloadingId, setDownloadingId] = useState<string | null>(null); // "sunat-{id}" | "receipt-{id}"
    const [modalOpen, setModalOpen] = useState(false);
    const [modalInvoice, setModalInvoice] = useState<AdminInvoice | null>(null);
    const [modalDetails, setModalDetails] = useState<AdminReceiptDetails | null>(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Fetching
    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminInvoicesService.getInvoices({
                limit: pageSize,
                offset: (page - 1) * pageSize,
                search: searchTerm || undefined,
                payment_state: paymentState !== 'all' ? paymentState : undefined,
                service_type: serviceType !== 'all' ? serviceType : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined
            });

            setInvoices(response?.invoices || []);
            setStats(response?.stats || {
                total_invoiced: 0,
                total_pending: 0,
                total_paid: 0
            });
            setTotalRecords(response?.total || 0);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, paymentState, serviceType, dateFrom, dateTo]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchInvoices]);

    // Handlers
    const handleDownloadPdf = async (inv: AdminInvoice) => {
        const key = `sunat-${inv.id}`;
        setDownloadingId(key);
        try {
            const blob = await adminInvoicesService.downloadInvoicePdf(inv.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${inv.name.replace(/\//g, '-')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading SUNAT PDF:", error);
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDownloadReceipt = async (inv: AdminInvoice) => {
        const key = `receipt-${inv.id}`;
        setDownloadingId(key);
        try {
            const blob = await adminInvoicesService.downloadUtilityReceipt(inv.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recibo-${inv.name.replace(/\//g, '-')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading receipt:", error);
        } finally {
            setDownloadingId(null);
        }
    };

    const handleViewConsumption = async (inv: AdminInvoice) => {
        setModalInvoice(inv);
        setModalOpen(true);
        setModalDetails(null);

        if (inv.reading) {
            setModalLoading(true);
            try {
                const details = await adminInvoicesService.getReceiptDetails(inv.reading.id);
                setModalDetails(details);
            } catch (error) {
                // Show modal with basic data even if details fail
                console.error("Error fetching receipt details:", error);
            } finally {
                setModalLoading(false);
            }
        }
    };

    const getDownloadingState = (invId: number): string | null => {
        if (downloadingId === `sunat-${invId}`) return 'sunat';
        if (downloadingId === `receipt-${invId}`) return 'receipt';
        return null;
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
                    value={`S/ ${(stats?.total_invoiced ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    colorClass="text-blue-500"
                    gradient="from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
                />
                <StatCard
                    title="Pendiente de Pago"
                    value={`S/ ${(stats?.total_pending ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                    icon={AlertCircle}
                    colorClass="text-amber-500"
                    gradient="from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400"
                />
                <StatCard
                    title="Recaudado (Efectivo)"
                    value={`S/ ${(stats?.total_paid ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                    icon={CheckCircle}
                    colorClass="text-emerald-500"
                    gradient="from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400"
                />
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200 space-y-4">

                {/* Service Type Tabs */}
                <div className="flex justify-start border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="inline-flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
                        <button
                            onClick={() => setServiceType('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${serviceType === 'all'
                                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setServiceType('water')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${serviceType === 'water'
                                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <Droplet className="w-4 h-4" /> Agua
                        </button>
                        <button
                            onClick={() => setServiceType('electricity')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${serviceType === 'electricity'
                                ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <Zap className="w-4 h-4" /> Luz
                        </button>
                    </div>
                </div>

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
                            <option value="not_paid">⏳ Pendientes</option>
                            <option value="paid">✓ Pagados</option>
                            <option value="in_payment">⟳ En proceso</option>
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
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 ml-auto"></div></td>
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
                                    <tr key={inv.id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
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
                                            {inv.service_type ? (
                                                <div className="flex items-center">
                                                    {inv.service_type === 'water' ? (
                                                        <span className="flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-800">
                                                            <Droplet className="h-3 w-3 mr-1.5" />
                                                            {inv.service_name || 'Agua'}
                                                        </span>
                                                    ) : inv.service_type === 'electricity' ? (
                                                        <span className="flex items-center text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md border border-amber-100 dark:border-amber-800">
                                                            <Zap className="h-3 w-3 mr-1.5" />
                                                            {inv.service_name || 'Luz'}
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                                                            <FileText className="h-3 w-3 mr-1.5" />
                                                            {inv.service_name || 'Servicio'}
                                                        </span>
                                                    )}
                                                    {inv.reading && (
                                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-mono">{inv.reading.period}</span>
                                                    )}
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
                                            <div className="flex flex-col gap-1">
                                                <StatusBadge state={inv.payment_state} />
                                                {inv.payment_state === 'not_paid' && inv.invoice_date_due && new Date(inv.invoice_date_due) < new Date() && (
                                                    <span className="px-2.5 py-0.5 inline-flex items-center text-xs font-medium rounded-full border bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 animate-pulse">
                                                        ⚠️ Vencido
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <ActionsDropdown
                                                invoice={inv}
                                                onViewConsumption={() => handleViewConsumption(inv)}
                                                onDownloadSunat={() => handleDownloadPdf(inv)}
                                                onDownloadReceipt={() => handleDownloadReceipt(inv)}
                                                whatsappHref={adminInvoicesService.generateWhatsAppLink(
                                                    inv.partner_phone || '',
                                                    inv.partner_name,
                                                    inv.reading?.period || inv.invoice_date,
                                                    inv.amount_total,
                                                    'https://tu-portal.com/mis-recibos'
                                                )}
                                                isDownloading={getDownloadingState(inv.id)}
                                            />
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

            {/* Consumption Detail Modal */}
            <ConsumptionModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                invoice={modalInvoice}
                details={modalDetails}
                loading={modalLoading}
                onDownloadReceipt={() => modalInvoice && handleDownloadReceipt(modalInvoice)}
            />
        </div>
    );
}
