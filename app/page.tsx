import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Droplet, Zap, Users, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Droplet className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Portal de Servicios</span>
          </div>
          <nav className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Acceso Clientes</Button>
            </Link>
            <Link href="/login-admin">
              <Button>Acceso Admin</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Gestiona tus Servicios de <span className="text-blue-600">Agua</span> y <span className="text-yellow-600">Luz</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Consulta tus recibos, realiza pagos y monitorea tu consumo desde un solo lugar.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/login">
              <Button size="lg" className="px-8">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Droplet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              Servicio de Agua
            </h3>
            <p className="text-gray-600 text-sm text-center">
              Monitorea tu consumo de agua en tiempo real y consulta tu historial
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              Servicio de Electricidad
            </h3>
            <p className="text-gray-600 text-sm text-center">
              Gestiona tu consumo eléctrico y recibe alertas de consumo alto
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              Gestión de Clientes
            </h3>
            <p className="text-gray-600 text-sm text-center">
              Portal intuitivo para consultar recibos y realizar pagos en línea
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              Reportes y Análisis
            </h3>
            <p className="text-gray-600 text-sm text-center">
              Visualiza estadísticas detalladas de consumo y tendencias
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">¿Listo para comenzar?</h2>
          <p className="text-xl mb-8 opacity-90">
            Accede a tu portal y comienza a gestionar tus servicios hoy mismo
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/login">
              <Button size="lg" variant="secondary" className="px-8">
                Acceso Clientes
              </Button>
            </Link>
            <Link href="/login-admin">
              <Button size="lg" variant="outline" className="px-8 text-white border-white hover:bg-white/10">
                Acceso Administrador
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 Portal de Servicios. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
