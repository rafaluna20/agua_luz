import { ClienteLayoutWrapper } from "@/components/layouts/ClienteLayoutWrapper";

export default function PagosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClienteLayoutWrapper>{children}</ClienteLayoutWrapper>;
}
