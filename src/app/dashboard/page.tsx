import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import {
    AdminDashboard,
    CourierDashboard,
    ClientDashboard
} from "@/components/dashboard";
import { SellerDashboard } from "@/components/dashboard/seller-dashboard"; // Import new component

import { getDeliveries } from "@/app/actions/delivery";
import { getSellerProducts, getSellerStats, getSellerDeliveries } from "@/app/actions/product";
import { getAllUsers } from "@/app/actions/users";
import { getAdminStats } from "@/app/actions/admin";

export default async function DashboardPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const userRole = session.user.role || "client";

    const sanitizedUser = {
        ...session.user,
        role: session.user.role ?? undefined,
        name: session.user.name,
        email: session.user.email
    };

    switch (userRole) {
        case "admin":
            const usersResult = await getAllUsers();
            const adminStatsResult = await getAdminStats();
            return <AdminDashboard
                user={sanitizedUser}
                users={usersResult.users || []}
                stats={adminStatsResult.stats}
                recentDeliveries={adminStatsResult.recentDeliveries}
            />;
        case "courier":
            const courierDeliveries = await getDeliveries({ courierId: session.user.id });
            return <CourierDashboard user={sanitizedUser} deliveries={courierDeliveries.deliveries || []} />;
        case "seller":
            const productsResult = await getSellerProducts();
            const statsResult = await getSellerStats();
            const deliveriesResult = await getSellerDeliveries();
            return <SellerDashboard
                user={sanitizedUser}
                products={productsResult.products || []}
                stats={statsResult.stats || { products: 0, sales: 0, revenue: 0 }}
                deliveries={deliveriesResult.deliveries || []}
            />;
        case "client":
        default:
            const { deliveries } = await getDeliveries({ clientId: session.user.id });
            return <ClientDashboard user={sanitizedUser} deliveries={deliveries || []} />;
    }
}
