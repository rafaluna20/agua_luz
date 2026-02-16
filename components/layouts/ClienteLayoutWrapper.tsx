"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/cliente/Sidebar";
import { Navbar } from "@/components/cliente/Navbar";
import { useAuthStore } from "@/lib/stores/authStore";

export function ClienteLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Solo sincronizar el estado de Zustand con localStorage
    // El middleware ya protegió esta ruta - si llegamos aquí, estamos autenticados
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-64">
        <Navbar />
        
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
