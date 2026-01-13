import { getDeliveries } from "@/app/actions/delivery"
import { Header, BottomNav } from "@/components/layout"
import { Map } from "@/components/map"
import { Card, CardContent } from "@/components/ui/card"
import { Truck, MapPin, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function TrackingPage() {
    const result = await getDeliveries({ status: "IN_TRANSIT" })
    const activeDeliveries = result.success ? result.deliveries || [] : []

    const arrivedResult = await getDeliveries({ status: "ARRIVED_ZONE" })
    const arrivedDeliveries = arrivedResult.success ? arrivedResult.deliveries || [] : []

    const allActive = [...activeDeliveries, ...arrivedDeliveries]

    const markers = allActive.map(d => ({
        lat: d.deliveryPoint?.latitude || 0,
        lng: d.deliveryPoint?.longitude || 0,
        description: `Livraison #${d.id.slice(0, 8)} - ${d.status === 'IN_TRANSIT' ? 'En cours' : 'Arrivé zone'}`
    }))

    return (
        <div className="min-h-screen bg-background pb-20 flex flex-col">
            <Header title="Suivi en direct" />

            <div className="h-[40vh] w-full relative border-b border-border shadow-inner">
                <Map readOnly markers={markers} />
                <div className="absolute top-4 left-4 z-10">
                    <div className="bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-lg flex items-center gap-2 text-xs font-semibold text-foreground">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        {allActive.length} livraisons actives
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Livraisons Actives</h2>

                <div className="space-y-3">
                    {allActive.length > 0 ? (
                        allActive.map((delivery) => (
                            <Link key={delivery.id} href={`/deliveries/${delivery.id}`}>
                                <Card className="overflow-hidden bg-card border-border shadow-sm active:scale-[0.98] transition-transform mb-3">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${delivery.status === 'ARRIVED_ZONE' ? 'bg-purple-500/10 text-purple-500' : 'bg-primary/10 text-primary'
                                                }`}>
                                                <Truck className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-foreground truncate">#{delivery.id.slice(0, 8)}</h3>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${delivery.status === 'ARRIVED_ZONE' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                                                        }`}>
                                                        {delivery.status === 'IN_TRANSIT' ? 'En transit' : 'Arrivé zone'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="truncate">{delivery.deliveryPoint?.description || "Point de livraison"}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border/50">
                            <Truck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">Aucune livraison en transit actuellement</p>
                        </div>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    )
}
