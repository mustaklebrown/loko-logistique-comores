import { getAllProductsAdmin } from "@/app/actions/product"
import { Header, BottomNav } from "@/components/layout"
import { MarketplaceManager } from "@/components/marketplace/marketplace-manager"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-server"

export default async function AdminMarketplacePage() {
    const session = await getSession()
    if (session?.user?.role !== 'admin') {
        redirect('/dashboard')
    }

    const result = await getAllProductsAdmin()
    const products = result.success ? result.products : []

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Marketplace" />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground">Gestion Marketplace</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Supervisez tous les produits de la plateforme</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Produits</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{products.length}</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vendeurs Actifs</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                            {new Set(products.map(p => p.sellerId)).size}
                        </p>
                    </div>
                </div>

                <MarketplaceManager initialProducts={products} />
            </main>
            <BottomNav />
        </div>
    )
}
