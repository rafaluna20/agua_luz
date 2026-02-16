import { ClienteLayoutWrapper } from "@/components/layouts/ClienteLayoutWrapper";

export default function RecibosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClienteLayoutWrapper>{children}</ClienteLayoutWrapper>;
}
