"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Gauge,
  BookOpen,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  QrCode,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useRouter } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Clientes",
    href: "/admin/clientes",
    icon: Users,
  },
  {
    name: "Medidores",
    href: "/admin/medidores",
    icon: Gauge,
  },
  {
    name: "Lecturas",
    href: "/admin/lecturas",
    icon: BookOpen,
  },
  {
    name: "Registrar Lectura",
    href: "/admin/lecturas/registrar",
    icon: BookOpen,
  },
  {
    name: "Recibos",
    href: "/admin/recibos",
    icon: FileText,
  },
  {
    name: "Generar QR",
    href: "/admin/qr-generator",
    icon: QrCode,
  },
  {
    name: "Reportes",
    href: "/admin/reportes",
    icon: BarChart3,
  },
  {
    name: "Configuración",
    href: "/admin/configuracion",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    // Force navigation to ensure we don't get stuck in protected route states
    router.replace("/login-admin");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static
          ${isCollapsed ? "md:w-20" : "md:w-64"} w-64
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {(!isCollapsed || isOpen) && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AS</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Admin Portal
              </span>
            </div>
          )}

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden md:block"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors md:hidden"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                  ${isCollapsed ? "md:justify-center" : ""}
                `}
                title={isCollapsed ? item.name : undefined}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 768 && onClose) onClose();
                }}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                    }`}
                />
                <span className={`font-medium text-sm ${isCollapsed ? "md:hidden" : "block"}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
              transition-colors
              ${isCollapsed ? "md:justify-center" : ""}
            `}
            title={isCollapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`font-medium text-sm ${isCollapsed ? "md:hidden" : "block"}`}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
