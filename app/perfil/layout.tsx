import { ClienteLayoutWrapper } from "@/components/layouts/ClienteLayoutWrapper";

export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClienteLayoutWrapper>{children}</ClienteLayoutWrapper>;
}
