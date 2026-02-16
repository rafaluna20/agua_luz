"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { useAuthStore } from "@/lib/stores/authStore";
import { useNotifySuccess, useNotifyError } from "@/lib/stores/uiStore";

// Schema de validación con Zod
const loginAdminSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Email inválido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

type LoginAdminFormData = z.infer<typeof loginAdminSchema>;

export default function LoginAdminPage() {
  const router = useRouter();
  const { loginAdmin, isAuthenticated, error: authError, clearError } = useAuthStore();
  const notifySuccess = useNotifySuccess();
  const notifyError = useNotifyError();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginAdminFormData>({
    resolver: zodResolver(loginAdminSchema),
  });

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin/dashboard");
    }
  }, [isAuthenticated, router]);

  // Mostrar error de autenticación
  useEffect(() => {
    if (authError) {
      notifyError("Error de autenticación", authError);
      clearError();
    }
  }, [authError, notifyError, clearError]);

  const onSubmit = async (data: LoginAdminFormData) => {
    try {
      console.log('🔐 Iniciando login de administrador...');
      await loginAdmin(data);
      console.log('✅ Login admin exitoso');
      notifySuccess("Bienvenido Administrador", "Acceso concedido");
      
      // Esperar un momento para que se persistan los datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push("/admin/dashboard");
    } catch (error: any) {
      console.error("❌ Error en login admin:", error);
    }
  };

  return (
    <Card className="w-full max-w-md border-2 border-blue-200">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
            <Shield className="h-10 w-10 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Panel de Administración</CardTitle>
        <CardDescription>
          Acceso exclusivo para administradores del sistema
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Security Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Área Restringida</p>
                <p className="text-xs mt-1">
                  Solo personal autorizado. Todos los accesos son monitoreados.
                </p>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Administrativo
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="admin@empresa.com"
                className="pl-10"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10"
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center text-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-600">Mantener sesión activa</span>
            </label>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verificando credenciales..." : "Acceder al Panel"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              ← Volver al login de clientes
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
