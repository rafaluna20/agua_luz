import { ClienteLayoutWrapper } from "@/components/layouts/ClienteLayoutWrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClienteLayoutWrapper>{children}</ClienteLayoutWrapper>;
}
