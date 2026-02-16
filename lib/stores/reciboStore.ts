import { create } from "zustand";
import type { Recibo, Invoice } from "@/types";

interface ReciboState {
  recibos: Recibo[];
  selectedRecibo: Recibo | null;
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;
}

interface ReciboActions {
  setRecibos: (recibos: Recibo[]) => void;
  setSelectedRecibo: (recibo: Recibo | null) => void;
  setInvoices: (invoices: Invoice[]) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  addRecibo: (recibo: Recibo) => void;
  updateRecibo: (id: number, updates: Partial<Recibo>) => void;
  removeRecibo: (id: number) => void;
  clearRecibos: () => void;
}

type ReciboStore = ReciboState & ReciboActions;

/**
 * Store de recibos y facturas con Zustand
 */
export const useReciboStore = create<ReciboStore>((set, get) => ({
  // Estado inicial
  recibos: [],
  selectedRecibo: null,
  invoices: [],
  selectedInvoice: null,
  isLoading: false,
  error: null,

  /**
   * Establece la lista de recibos
   */
  setRecibos: (recibos: Recibo[]) => {
    set({ recibos, error: null });
  },

  /**
   * Establece el recibo seleccionado
   */
  setSelectedRecibo: (recibo: Recibo | null) => {
    set({ selectedRecibo: recibo });
  },

  /**
   * Establece la lista de facturas
   */
  setInvoices: (invoices: Invoice[]) => {
    set({ invoices, error: null });
  },

  /**
   * Establece la factura seleccionada
   */
  setSelectedInvoice: (invoice: Invoice | null) => {
    set({ selectedInvoice: invoice });
  },

  /**
   * Establece el estado de carga
   */
  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  /**
   * Establece un error
   */
  setError: (error: string | null) => {
    set({ error, isLoading: false });
  },

  /**
   * Limpia el error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Agrega un nuevo recibo a la lista
   */
  addRecibo: (recibo: Recibo) => {
    const { recibos } = get();
    set({ recibos: [recibo, ...recibos] });
  },

  /**
   * Actualiza un recibo existente
   */
  updateRecibo: (id: number, updates: Partial<Recibo>) => {
    const { recibos } = get();
    const updatedRecibos = recibos.map((recibo) =>
      recibo.id === id ? { ...recibo, ...updates } : recibo
    );
    set({ recibos: updatedRecibos });

    // Si el recibo seleccionado es el que se actualizó, actualizar también
    const { selectedRecibo } = get();
    if (selectedRecibo?.id === id) {
      set({ selectedRecibo: { ...selectedRecibo, ...updates } });
    }
  },

  /**
   * Elimina un recibo de la lista
   */
  removeRecibo: (id: number) => {
    const { recibos } = get();
    const filteredRecibos = recibos.filter((recibo) => recibo.id !== id);
    set({ recibos: filteredRecibos });

    // Si el recibo eliminado es el seleccionado, limpiar selección
    const { selectedRecibo } = get();
    if (selectedRecibo?.id === id) {
      set({ selectedRecibo: null });
    }
  },

  /**
   * Limpia todos los recibos
   */
  clearRecibos: () => {
    set({
      recibos: [],
      selectedRecibo: null,
      invoices: [],
      selectedInvoice: null,
      error: null,
    });
  },
}));

/**
 * Hook para obtener recibos pendientes
 */
export const useRecibosPendientes = () => {
  return useReciboStore((state) =>
    state.recibos.filter((recibo) => recibo.estado === "pendiente")
  );
};

/**
 * Hook para obtener recibos pagados
 */
export const useRecibosPagados = () => {
  return useReciboStore((state) =>
    state.recibos.filter((recibo) => recibo.estado === "pagado")
  );
};

/**
 * Hook para obtener recibos vencidos
 */
export const useRecibosVencidos = () => {
  return useReciboStore((state) =>
    state.recibos.filter((recibo) => recibo.estado === "vencido")
  );
};

/**
 * Hook para obtener el total de deuda pendiente
 */
export const useTotalDeuda = () => {
  return useReciboStore((state) =>
    state.recibos
      .filter((recibo) => recibo.estado === "pendiente" || recibo.estado === "vencido")
      .reduce((total, recibo) => total + recibo.total, 0)
  );
};
