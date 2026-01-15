import Link from "next/link"
import { ArrowRight, Package, MapPin, Truck } from "lucide-react"
import { Header, BottomNav } from "@/components/layout"
import { DashboardStats } from "@/components/dashboard"
import { DeliveryCard } from "@/components/delivery/delivery-card"
import { Button } from "@/components/ui/button"
import { getDeliveries } from "@/app/actions/delivery"
import { getSession } from "@/lib/auth-server"

export default async function HomePage() {
  const session = await getSession()

  let deliveries: any[] = []
  let allDeliveries: any[] = []

  if (session?.user) {
    const result = await getDeliveries({ clientId: session.user.id })
    if (result.success) {
      allDeliveries = result.deliveries || []
      deliveries = allDeliveries.slice(0, 3)
    }
  }

  // Calculate stats (in production, this would be a separate optimized query)
  // If not logged in, allDeliveries is empty, so stats are 0
  const stats = {
    total: allDeliveries.length,
    inTransit: allDeliveries.filter((d) => d.status === "IN_TRANSIT").length,
    delivered: allDeliveries.filter((d) => d.status === "DELIVERED").length,
    pending: allDeliveries.filter((d) => d.status === "CREATED").length,
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Welcome Section */}
        <section className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour {session?.user?.name ? `${session.user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos livraisons en temps réel
          </p>
        </section>

        {/* Stats */}
        <section className="mb-6">
          <DashboardStats stats={stats} />
        </section>

        {/* Quick Actions */}
        <section className="mb-6">
          <div className="flex gap-3">
            <Link href="/deliveries/create" className="flex-1">
              <Button className="w-full h-12 gap-2 text-base" size="lg">
                <Package className="h-5 w-5" />
                Nouvelle livraison
              </Button>
            </Link>
            <Link href="/tracking" className="flex-1">
              <Button variant="outline" className="w-full h-12 gap-2 text-base" size="lg">
                <MapPin className="h-5 w-5" />
                Suivi GPS
              </Button>
            </Link>
          </div>
        </section>

        {/* Recent Deliveries */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Récentes</h2>
            <Link
              href="/deliveries"
              className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
            >
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {deliveries.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-muted p-8 text-center">
              <Truck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">{session?.user ? "Aucune livraison pour le moment" : "Connectez-vous pour voir vos livraisons"}</p>
              <Link href={session?.user ? "/deliveries/create" : "/login"}>
                <Button variant="link" className="mt-2">
                  {session?.user ? "Créer votre première livraison" : "Se connecter"}
                </Button>
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
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
