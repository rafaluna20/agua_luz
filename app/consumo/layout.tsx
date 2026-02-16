import { ClienteLayoutWrapper } from "@/components/layouts/ClienteLayoutWrapper";

export default function ConsumoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClienteLayoutWrapper>{children}</ClienteLayoutWrapper>;
}
