import { getCouriers } from "@/app/actions/users"
import { Header, BottomNav } from "@/components/layout"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Phone, Mail, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function CouriersPage() {
    const result = await getCouriers()
    const couriers = result.success ? result.couriers : []

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Coursiers" />
            <main className="max-w-lg mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Nos Coursiers</h1>
                    <p className="text-muted-foreground mt-1">Liste des partenaires de livraison actifs</p>
                </div>

                <div className="space-y-4">
                    {couriers.length > 0 ? (
                        couriers.map((courier) => (
                            <Card key={courier.id} className="overflow-hidden bg-card border-border shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                            {courier.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-foreground truncate">{courier.name}</h3>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="truncate">{courier.email}</span>
                                                </div>
                                                {courier.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Phone className="w-3 h-3" />
                                                        <span>{courier.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-muted-foreground">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
                            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">Aucun coursier trouvé</p>
                        </div>
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    )
}
