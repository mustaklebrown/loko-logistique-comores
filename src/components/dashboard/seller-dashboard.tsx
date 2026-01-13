"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Package, DollarSign, TrendingUp, ShoppingBag, Edit, Trash2, Home, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createProduct, updateProduct } from "@/app/actions/product"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface SellerDashboardProps {
    user: any
    products: any[]
    stats: {
        products: number
        sales: number
        revenue: number
        totalItemsSold?: number
    }
    deliveries?: any[]
}

const statusColors: Record<string, string> = {
    DELIVERED: "bg-emerald-100 text-emerald-700",
    IN_TRANSIT: "bg-blue-100 text-blue-700",
    ASSIGNED: "bg-purple-100 text-purple-700",
    CREATED: "bg-slate-100 text-slate-700",
};

const statusLabels: Record<string, string> = {
    DELIVERED: "Livré",
    IN_TRANSIT: "En cours",
    ASSIGNED: "Assigné",
    CREATED: "En attente",
};


export function SellerDashboard({ user, products, stats, deliveries = [] }: SellerDashboardProps) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const router = useRouter()

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="bg-background border-b border-border/50 px-4 py-4 sticky top-0 z-40">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Tableau de bord Vendeur</h1>
                        <p className="text-sm text-muted-foreground">{user.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <Home className="h-5 w-5" />
                            </Button>
                        </Link>
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nouveau Produit
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="text-foreground">Ajouter un produit</DialogTitle>
                                </DialogHeader>
                                <ProductForm onSuccess={() => { setIsAddOpen(false); router.refresh(); }} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {(!user.latitude || !user.longitude) && (
                    <Card className="bg-amber-500/10 border-amber-500/20 shadow-none">
                        <CardContent className="p-4 flex items-start gap-4">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-amber-500" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <h3 className="font-bold text-amber-900 text-sm">Adresse manquante</h3>
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    Vous n'avez pas encore défini votre adresse de collecte.
                                    Les coursiers ne pourront pas localiser votre boutique pour récupérer les commandes.
                                </p>
                                <Link href="/profile">
                                    <Button variant="link" className="p-0 h-auto text-amber-900 font-bold text-xs underline">
                                        Configurer mon adresse maintenant
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-card border-border shadow-sm">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                                <Package className="h-5 w-5 text-blue-500" />
                            </div>
                            <p className="text-2xl font-bold text-foreground">{stats.products}</p>
                            <p className="text-xs text-muted-foreground">Produits</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border shadow-sm">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                            </div>
                            <p className="text-2xl font-bold text-foreground">{stats.sales}</p>
                            <p className="text-xs text-muted-foreground">Commandes</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border shadow-sm">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                                <ShoppingBag className="h-5 w-5 text-purple-500" />
                            </div>
                            <p className="text-2xl font-bold text-foreground">{stats.totalItemsSold || 0}</p>
                            <p className="text-xs text-muted-foreground">Unités Vendues</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-border shadow-sm">
                        <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                                <DollarSign className="h-5 w-5 text-amber-500" />
                            </div>
                            <p className="text-2xl font-bold text-foreground">{stats.revenue.toLocaleString()}€</p>
                            <p className="text-xs text-muted-foreground">Revenus</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="products" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="products">Mes Produits</TabsTrigger>
                        <TabsTrigger value="deliveries">Suivi des Livraisons</TabsTrigger>
                    </TabsList>

                    <TabsContent value="products" className="space-y-4 pt-4">
                        <h2 className="text-lg font-semibold mb-4 sr-only">Mes Produits</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {products.map((product) => (
                                <Card key={product.id} className="overflow-hidden bg-card border-border shadow-sm">
                                    <div className="flex">
                                        <div className="w-24 bg-muted flex items-center justify-center">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1 p-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                                                    <p className="text-sm text-primary font-bold">{product.price.toLocaleString()}€</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.stock > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                                                    Stock: {product.stock}
                                                </span>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {products.length === 0 && (
                                <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Aucun produit en vente</p>
                                    <Button variant="link" onClick={() => setIsAddOpen(true)}>Ajouter un produit</Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="deliveries" className="space-y-4 pt-4">
                        <div className="space-y-4">
                            {deliveries.length > 0 ? (
                                deliveries.map((delivery) => (
                                    <Card key={delivery.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={statusColors[delivery.status] || "bg-gray-100"}>
                                                        {statusLabels[delivery.status] || delivery.status}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(delivery.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <span className="font-bold">
                                                    {delivery.items?.length || 0} articles
                                                </span>
                                            </div>

                                            <div className="text-sm space-y-1">
                                                <p><span className="text-muted-foreground">Client:</span> {delivery.client?.name}</p>
                                                <p><span className="text-muted-foreground">Zone:</span> {delivery.deliveryPoint?.description || "Non spécifiée"}</p>
                                                {delivery.courier && (
                                                    <p><span className="text-muted-foreground">Coursier:</span> {delivery.courier.name}</p>
                                                )}
                                            </div>

                                            {delivery.items && delivery.items.length > 0 && (
                                                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                                                    {delivery.items.map((item: any, idx: number) => (
                                                        <span key={idx} className="mr-2">
                                                            {item.quantity}x {item.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Aucune livraison en cours</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}

function ProductForm({ onSuccess }: { onSuccess: () => void }) {
    const [isLoading, setIsLoading] = useState(false)

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            price: parseFloat(formData.get("price") as string),
            stock: parseInt(formData.get("stock") as string),
            image: formData.get("image") as string,
        }

        const res = await createProduct(data)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Produit ajouté !")
            onSuccess()
        }
        setIsLoading(false)
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Nom</Label>
                <Input id="name" name="name" required className="bg-background border-input text-foreground" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Input id="description" name="description" className="bg-background border-input text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price" className="text-foreground">Prix (€)</Label>
                    <Input id="price" name="price" type="number" step="0.01" required className="bg-background border-input text-foreground" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="stock" className="text-foreground">Stock</Label>
                    <Input id="stock" name="stock" type="number" required className="bg-background border-input text-foreground" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="image" className="text-foreground">URL Image</Label>
                <Input id="image" name="image" placeholder="https://..." className="bg-background border-input text-foreground" />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Envoi..." : "Enregistrer"}
            </Button>
        </form>
    )
}
