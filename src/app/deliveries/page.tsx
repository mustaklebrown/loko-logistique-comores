import Link from "next/link"
import { Plus } from "lucide-react"
import { Header, BottomNav } from "@/components/layout"
import { DeliveryCard } from "@/components/delivery/delivery-card"
import { Button } from "@/components/ui/button"
import { getDeliveries } from "@/app/actions/delivery"
import { getSession } from "@/lib/auth-server"
import { DeliveryFilters } from "@/components/delivery/delivery-filters"

import { DeliveriesList } from "@/components/delivery/deliveries-list"

export default async function DeliveriesPage({
    searchParams
}: {
    searchParams: Promise<{ status?: string, search?: string }>
}) {
    const params = await searchParams
    const session = await getSession()

    // Base filters
    const filters: any = {
        status: params.status && params.status !== "ALL" ? params.status : undefined,
        search: params.search
    }

    // Role-based filtering
    if (session?.user.role === 'client') {
        filters.clientId = session.user.id
    }

    const result = await getDeliveries(filters)
    const deliveries = result.success ? result.deliveries ?? [] : []

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Livraisons" />

            <main className="mx-auto max-w-lg px-4 py-4">
                <DeliveryFilters />

                {/* Deliveries List */}
                <div className="mt-4">
                    {deliveries.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-muted p-12 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <Plus className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">Aucune livraison</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {params.search || params.status
                                    ? "Aucun résultat pour vos filtres actuels"
                                    : "Commencez par créer votre première livraison"}
                            </p>
                            {!params.search && !params.status && (
                                <Link href="/deliveries/create">
                                    <Button>Créer une livraison</Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <DeliveriesList deliveries={deliveries} />
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    )
}
