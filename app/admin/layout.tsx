"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/authStore";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminNavbar from "@/components/admin/Navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [showManualRedirect, setShowManualRedirect] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Verificar autenticación al montar el componente
  useEffect(() => {
    console.log('🔄 AdminLayout: Verificando autenticación inicial...');
    checkAuth();
    setIsChecking(false);
  }, [checkAuth]);

  useEffect(() => {
    if (isChecking) return;

    // Timer para mostrar opción manual después de 2 segundos
    const timer = setTimeout(() => {
      setShowManualRedirect(true);
    }, 2000);

    console.log('🔍 AdminLayout: Estado - isAuthenticated:', isAuthenticated, 'role:', user?.role);

    if (!isAuthenticated) {
      console.log('⚠️ AdminLayout: No autenticado, redirigiendo a login-admin...');
      router.replace("/login-admin");
      return () => clearTimeout(timer);
    }

    if (user?.role !== "admin") {
      console.log('⚠️ AdminLayout: Usuario no es admin, redirigiendo a dashboard cliente...');
      router.push("/dashboard");
      return () => clearTimeout(timer);
    }

    console.log('✅ AdminLayout: Usuario admin autenticado correctamente');
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router, isChecking]);

  // Mostrar un loader mientras se verifica la autenticación
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Verificando autenticación...</p>

          {showManualRedirect && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-gray-700 mb-3">
                La redirección automática está tardando más de lo esperado.
              </p>
              <button
                onClick={() => router.push("/login-admin")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir al Login Manualmente
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <AdminSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <AdminNavbar onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
