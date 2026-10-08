"use client";

import { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Lock, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/lib/stores/authStore";
import { useNotifySuccess, useNotifyError } from "@/lib/stores/uiStore";
import { portalCustomerService } from "@/lib/services/portal-customer.service";

export default function PerfilPage() {
  const { user } = useAuthStore();
  const notifySuccess = useNotifySuccess();
  const notifyError = useNotifyError();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const datosDe = (c?: { name?: string; email?: string; phone?: unknown; street?: unknown }) => ({
    name: c?.name || user?.name || "",
    email: c?.email || user?.email || "",
    phone: typeof c?.phone === "string" ? c.phone : "",
    address: typeof c?.street === "string" ? c.street : "",
  });

  const [formData, setFormData] = useState(datosDe());
  const [original, setOriginal] = useState(datosDe());
  const [guardando, setGuardando] = useState(false);
  const [clienteId, setClienteId] = useState<number | null>(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Los datos salen del servidor, no de lo que quedó guardado en el navegador.
  useEffect(() => {
    let activo = true;
    portalCustomerService
      .getMe()
      .then((cliente) => {
        if (!activo) return;
        setClienteId(cliente.id);
        const datos = datosDe(cliente);
        setFormData(datos);
        setOriginal(datos);
      })
      .catch(() => notifyError("No se pudieron cargar tus datos", "Intenta de nuevo en unos minutos."));
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mensajeDe = (error: unknown) => (error instanceof Error ? error.message : "Intenta de nuevo en unos minutos.");

  const handleSaveProfile = async () => {
    setGuardando(true);
    try {
      await portalCustomerService.updateProfile({ phone: formData.phone, street: formData.address });
      setOriginal(formData);
      notifySuccess("Perfil actualizado", "Tus datos han sido guardados correctamente");
      setIsEditing(false);
    } catch (error) {
      notifyError("No se pudo guardar tu perfil", mensajeDe(error));
    } finally {
      setGuardando(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notifyError("Error", "Las contraseñas no coinciden");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      notifyError("Contraseña débil", "Debe tener al menos 8 letras, con mayúscula, minúscula, número y un símbolo.");
      return;
    }
    setGuardando(true);
    try {
      await portalCustomerService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      notifySuccess("Contraseña actualizada", "Tu contraseña ha sido cambiada correctamente");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsChangingPassword(false);
    } catch (error) {
      notifyError("No se pudo cambiar la contraseña", mensajeDe(error));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Tus datos de contacto y dirección</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <div className="flex items-center space-x-2 text-gray-900">
                <User className="h-4 w-4 text-gray-400" />
                <span>{formData.name}</span>
                {isEditing && <span className="text-xs text-gray-500">(Para cambiarlo, contacte a la administración)</span>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="flex items-center space-x-2 text-gray-900">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{formData.email}</span>
                <span className="text-xs text-gray-500">(No editable)</span>
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="987 654 321"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-900">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{formData.phone || "No registrado"}</span>
                </div>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              {isEditing ? (
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Av. Los Jardines 123"
                />
              ) : (
                <div className="flex items-center space-x-2 text-gray-900">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{formData.address || "No registrada"}</span>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveProfile} disabled={guardando}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(original);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cambiar Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>Cambia tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent>
          {!isChangingPassword ? (
            <Button
              variant="outline"
              onClick={() => setIsChangingPassword(true)}
            >
              <Lock className="h-4 w-4 mr-2" />
              Cambiar Contraseña
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Actual
                </label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleChangePassword} disabled={guardando}>
                  Actualizar Contraseña
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información de la Cuenta */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Cuenta</CardTitle>
          <CardDescription>Detalles de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo de cuenta:</span>
              <span className="font-medium text-gray-900">Cliente</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID de Cliente:</span>
              <span className="font-medium text-gray-900">{clienteId ?? user?.customer_id ?? "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Activo
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
