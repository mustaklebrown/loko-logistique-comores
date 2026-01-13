import Link from "next/link"
import { Plus, Filter, Search } from "lucide-react"
import { Header, BottomNav } from "@/components/layout"
import { DeliveryCard } from "@/components/delivery/delivery-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getDeliveries } from "@/app/actions/delivery"


import { getSession } from "@/lib/auth-server"

export default async function DeliveriesPage() {
    const session = await getSession()

    // Filter for clients, show all for courier/admin (Marketplace)
    const filters: any = {}
    if (session?.user.role === 'client') {
        filters.clientId = session.user.id
    }

    const result = await getDeliveries(filters)
    const deliveries = result.success ? result.deliveries ?? [] : []

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Livraisons" />

            <main className="mx-auto max-w-lg px-4 py-4">
                {/* Search & Filter Bar */}
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-9 bg-muted/50 border-0"
                        />
                    </div>
                    <Button variant="outline" size="icon" className="shrink-0">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                {/* Status Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
                    {["Toutes", "En attente", "En transit", "Livrées"].map((filter) => (
                        <Button
                            key={filter}
                            variant={filter === "Toutes" ? "default" : "outline"}
                            size="sm"
                            className="shrink-0 rounded-full"
                        >
                            {filter}
                        </Button>
                    ))}
                </div>

                {/* Deliveries List */}
                {deliveries.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-muted p-12 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">Aucune livraison</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Commencez par créer votre première livraison
                        </p>
                        <Link href="/deliveries/create">
                            <Button>Créer une livraison</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {deliveries.map((delivery) => (
                            <DeliveryCard
                                key={delivery.id}
                                id={delivery.id}
                                status={delivery.status as any}
                                description={delivery.deliveryPoint?.description}
                                courierName={delivery.courier?.name}
                                createdAt={delivery.createdAt}
                            />
                        ))}
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    )
}
