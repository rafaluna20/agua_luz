import type { User } from "@/types";

/** Roles del personal, de menor a mayor: lector, supervisor y gerente. El servidor es quien los exige. */
export type UtilityRole = "operator" | "supervisor" | "manager";

const ORDEN: Record<UtilityRole, number> = { operator: 0, supervisor: 1, manager: 2 };

export const ETIQUETA_ROL: Record<UtilityRole, string> = {
  operator: "Lector",
  supervisor: "Supervisor",
  manager: "Gerente",
};

/** Rol mínimo para cada pantalla del panel; gana el prefijo más largo. Lo que no figura exige supervisor. */
const RUTAS: { prefijo: string; minimo: UtilityRole }[] = [
  { prefijo: "/admin/lecturas", minimo: "operator" },
  { prefijo: "/admin/medidores", minimo: "operator" },
  { prefijo: "/admin/qr-generator", minimo: "operator" },
  { prefijo: "/admin/dashboard/progreso", minimo: "operator" },
  { prefijo: "/admin/dashboard", minimo: "supervisor" },
  { prefijo: "/admin/clientes", minimo: "supervisor" },
  { prefijo: "/admin/recibos", minimo: "supervisor" },
  { prefijo: "/admin/conciliacion", minimo: "supervisor" },
  { prefijo: "/admin/morosos", minimo: "supervisor" },
  { prefijo: "/admin/reportes", minimo: "supervisor" },
  { prefijo: "/admin/configuracion", minimo: "manager" },
];

/** Sin dato del servidor se asume el rol más bajo: nunca se da de más. */
export function rolDe(user: Pick<User, "utility_role"> | null | undefined): UtilityRole {
  const rol = user?.utility_role;
  return rol && rol in ORDEN ? rol : "operator";
}

export function rolMinimoDe(pathname: string): UtilityRole {
  const coincidencias = RUTAS.filter((r) => pathname === r.prefijo || pathname.startsWith(r.prefijo + "/"));
  if (coincidencias.length === 0) return "supervisor";
  return coincidencias.sort((a, b) => b.prefijo.length - a.prefijo.length)[0].minimo;
}

export function puedeVer(rol: UtilityRole, pathname: string): boolean {
  return ORDEN[rol] >= ORDEN[rolMinimoDe(pathname)];
}

/** Pantalla con la que arranca cada rol: el lector entra directo a registrar lecturas. */
export function rutaInicial(rol: UtilityRole): string {
  return rol === "operator" ? "/admin/lecturas/registrar" : "/admin/dashboard";
}
