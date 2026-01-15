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
            try {
                const [usersResult, adminStatsResult] = await Promise.all([
                    getAllUsers(),
                    getAdminStats()
                ]);
                return <AdminDashboard
                    user={sanitizedUser}
                    users={usersResult.users || []}
                    stats={adminStatsResult.stats}
                    recentDeliveries={adminStatsResult.recentDeliveries}
                />;
            } catch (e) {
                console.error("Admin dash offline/error", e)
                return <AdminDashboard user={sanitizedUser} users={[]} stats={{ totalDeliveries: 0, activeCouriers: 0, deliveryPoints: 0, totalClients: 0 }} recentDeliveries={[]} />
            }
        case "courier":
            try {
                const courierDeliveries = await getDeliveries({ courierId: session.user.id });
                return <CourierDashboard user={sanitizedUser} deliveries={courierDeliveries.deliveries || []} />;
            } catch (e) {
                return <CourierDashboard user={sanitizedUser} deliveries={[]} />;
            }
        case "seller":
            try {
                const [productsResult, statsResult, deliveriesResult] = await Promise.all([
                    getSellerProducts(),
                    getSellerStats(),
                    getSellerDeliveries()
                ]);
                return <SellerDashboard
                    user={sanitizedUser}
                    products={productsResult.products || []}
                    stats={statsResult.stats || { products: 0, sales: 0, revenue: 0 }}
                    deliveries={deliveriesResult.deliveries || []}
                />;
            } catch (e) {
                return <SellerDashboard user={sanitizedUser} products={[]} stats={{ products: 0, sales: 0, revenue: 0 }} deliveries={[]} />;
            }
        case "client":
        default:
            try {
                const { deliveries } = await getDeliveries({ clientId: session.user.id });
                return <ClientDashboard user={sanitizedUser} deliveries={deliveries || []} />;
            } catch (e) {
                return <ClientDashboard user={sanitizedUser} deliveries={[]} />;
            }
    }
}
