"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Trash2, ShoppingBag, Store, AlertTriangle, Package } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { deleteProduct } from "@/app/actions/product"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import Image from "next/image"

interface MarketplaceManagerProps {
    initialProducts: any[]
}

export function MarketplaceManager({ initialProducts }: MarketplaceManagerProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [products, setProducts] = useState(initialProducts)

    const filteredProducts = products.filter((p: any) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleDelete = async (id: string) => {
        setIsDeleting(id)
        const res = await deleteProduct(id)
        if (res.success) {
            toast.success("Produit supprimé")
            setProducts(products.filter(p => p.id !== id))
        } else {
            toast.error(res.error || "Erreur lors de la suppression")
        }
        setIsDeleting(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un produit ou un vendeur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-card border-border h-11"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="overflow-hidden bg-card border-border shadow-sm group hover:shadow-md transition-all duration-300">
                                <div className="aspect-video relative bg-muted overflow-hidden">
                                    {product.image ? (
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <ShoppingBag className="w-12 h-12 opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 flex gap-2">
                                        <Badge className="bg-background/80 backdrop-blur-md text-foreground border-border shadow-sm">
                                            {product.price.toLocaleString()} €
                                        </Badge>
                                        <Badge variant={product.stock > 10 ? "default" : "destructive"} className="shadow-sm">
                                            Stock: {product.stock}
                                        </Badge>
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="font-bold text-foreground text-lg mb-1 truncate">{product.name}</h3>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                        <Store className="h-3.5 w-3.5 text-primary" />
                                        <span className="truncate">{product.seller?.name || "Vendeur inconnu"}</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">ID Produit</span>
                                            <span className="text-[11px] font-mono text-muted-foreground/70">#{product.id.slice(0, 8)}</span>
                                        </div>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10">
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-background border-border">
                                                <DialogHeader>
                                                    <DialogTitle className="text-foreground">Supprimer le produit ?</DialogTitle>
                                                    <DialogDescription className="text-muted-foreground">
                                                        Cette action est irréversible. Le produit "{product.name}" sera définitivement supprimé du catalogue.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" className="bg-muted text-foreground border-border">Annuler</Button>
                                                    </DialogTrigger>
                                                    <Button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        {isDeleting === product.id ? "Suppression..." : "Supprimer"}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredProducts.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-muted/20 rounded-2xl border border-dashed border-border">
                        <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground">Aucun produit trouvé</h3>
                        <p className="text-muted-foreground text-sm">Essayez un autre mot-clé ou vérifiez plus tard.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
