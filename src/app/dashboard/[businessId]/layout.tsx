import AdminShell from "@/components/admin/AdminShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard | Foodeez",
    description: "Foodeez restaurant admin dashboard",
};

export default async function RootLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ businessId: string }>;
}) {
    const { businessId } = await params;

    return (
        <AdminShell businessId={businessId}>
            {children}
        </AdminShell>
    );
}
