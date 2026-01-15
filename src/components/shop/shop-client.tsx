"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Header, BottomNav } from "@/components/layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createDelivery } from "@/app/actions/delivery"
import { createSavedAddress } from "@/app/actions/saved-addresses"
import { MapPin, Check, Loader2, Plus, ShoppingCart, Save, Trash2, Minus, Filter, X, Store, Package, Eye, WifiOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Image from "next/image"
import { useOffline } from "@/hooks/use-offline"
import { offlineStorage } from "@/lib/offline-storage"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Consistent number formatting to avoid hydration mismatch
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { useGrouping: true }).format(price)
}

interface ShopClientProps {
    products: any[];
    user?: any;
    savedAddresses?: any[];
}

export function ShopClient({ products = [], user, savedAddresses = [] }: ShopClientProps) {
    const [cart, setCart] = useState<any[]>([])
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [isLocating, setIsLocating] = useState(false)
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
    const isOffline = useOffline()

    // Filter state
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedSeller, setSelectedSeller] = useState<string>("all")
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Address selection state
    const [addressMode, setAddressMode] = useState<string>(
        user?.latitude && user?.longitude ? "profile" : "gps"
    )
    const [selectedSavedId, setSelectedSavedId] = useState<string | null>(
        savedAddresses.length > 0 ? savedAddresses[0].id : null
    )

    // Save address state
    const [shouldSaveAddress, setShouldSaveAddress] = useState(savedAddresses.length === 0)
    const [newAddrLabel, setNewAddrLabel] = useState("")

    const router = useRouter()

    // Get unique sellers for filter
    const sellers = useMemo(() => {
        const sellerMap = new Map<string, string>()
        products.forEach(p => {
            if (p.sellerId && p.seller?.name) {
                sellerMap.set(p.sellerId, p.seller.name)
            }
        })
        return Array.from(sellerMap.entries()).map(([id, name]) => ({ id, name }))
    }, [products])

    // Filtered products
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = !searchQuery ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesSeller = selectedSeller === "all" || product.sellerId === selectedSeller

            return matchesSearch && matchesSeller
        })
    }, [products, searchQuery, selectedSeller])

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id)
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)
            }
            return [...prev, { ...product, quantity: 1 }]
        })
        toast.success("Produit ajouté au panier")
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(p => p.id !== productId))
    }

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            return prev.map(p => {
                if (p.id === productId) {
                    const newQty = p.quantity + delta
                    return newQty > 0 ? { ...p, quantity: newQty } : p
                }
                return p
            })
        })
    }

    const handleCheckout = async () => {
        if (!user) {
            toast.error("Veuillez vous connecter pour valider la commande")
            router.push("/login")
            return
        }

        let lat: number;
        let lng: number;
        let desc = `Livraison de ${cart.length} articles depuis la boutique`;

        if (addressMode === "profile" && user?.latitude && user?.longitude) {
            lat = user.latitude;
            lng = user.longitude;
            desc += ` - Profil: ${user.city || ''} ${user.neighborhood || ''}`;
        } else if (addressMode === "saved" && selectedSavedId) {
            const addr = savedAddresses.find(a => a.id === selectedSavedId);
            if (!addr) {
                toast.error("Adresse introuvable");
                return;
            }
            lat = addr.latitude;
            lng = addr.longitude;
            desc += ` - Saved: ${addr.label} (${addr.city}, ${addr.neighborhood})`;
        } else {
            // GPS mode
            if (shouldSaveAddress && !newAddrLabel) {
                toast.error("Veuillez donner un nom à cette adresse pour l'enregistrer")
                return
            }
            setIsLocating(true)
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                    })
                })
                lat = position.coords.latitude;
                lng = position.coords.longitude;
                desc += ` (GPS)`;

                // Save if requested
                if (shouldSaveAddress && newAddrLabel) {
                    await createSavedAddress({
                        label: newAddrLabel,
                        latitude: lat,
                        longitude: lng,
                        city: "GPS",
                        neighborhood: "Instant"
                    })
                }
            } catch (error) {
                toast.error("GPS non disponible")
                setIsLocating(false)
                return;
            } finally {
                setIsLocating(false)
            }
        }

        setIsCheckingOut(true)
        try {
            const sellerIds = new Set(cart.map(item => item.sellerId));
            const sellerId = sellerIds.size === 1 ? Array.from(sellerIds)[0] : undefined;

            if (isOffline) {
                offlineStorage.save('CREATE_DELIVERY', {
                    latitude: lat,
                    longitude: lng,
                    description: desc,
                    items: cart,
                    sellerId: sellerId as string,
                })
                toast.success("Commande sauvegardée hors ligne ! Elle sera envoyée une fois connecté.")
                setIsCartOpen(false)
                setCart([])
                setIsCheckingOut(false)
                return
            }

            const result = await createDelivery({
                latitude: lat,
                longitude: lng,
                description: desc,
                items: cart,
                sellerId: sellerId as string,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Livraison créée !")
                setIsCartOpen(false)
                setCart([])
                router.push(`/deliveries/${result.deliveryId}`)
            }
        } catch (error) {
            toast.error("Erreur serveur")
        } finally {
            setIsCheckingOut(false)
        }
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const activeFiltersCount = (selectedSeller !== "all" ? 1 : 0) + (searchQuery ? 1 : 0)


    return (
        <div className="min-h-screen bg-background pb-24">
            <Header title="Boutique en ligne" />

            <main className="container max-w-lg mx-auto p-4 space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Input
                            placeholder="Rechercher un produit..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setSearchQuery("")}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="relative shrink-0">
                                <Filter className="h-4 w-4" />
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Filtres
                                </SheetTitle>
                                <SheetDescription>
                                    Affinez votre recherche
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Vendeur</Label>
                                    <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tous les vendeurs" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                <span className="flex items-center gap-2">
                                                    <Store className="h-4 w-4" />
                                                    Tous les vendeurs
                                                </span>
                                            </SelectItem>
                                            {sellers.map(seller => (
                                                <SelectItem key={seller.id} value={seller.id}>
                                                    {seller.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <SheetFooter className="flex-row gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setSelectedSeller("all")
                                        setSearchQuery("")
                                    }}
                                >
                                    Réinitialiser
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => setIsFilterOpen(false)}
                                >
                                    Appliquer
                                </Button>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Active Filters Display */}
                {(selectedSeller !== "all" || searchQuery) && (
                    <div className="flex flex-wrap gap-2">
                        {searchQuery && (
                            <Badge variant="secondary" className="gap-1 pr-1">
                                Recherche: {searchQuery}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-1 hover:bg-transparent"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        )}
                        {selectedSeller !== "all" && (
                            <Badge variant="secondary" className="gap-1 pr-1">
                                Vendeur: {sellers.find(s => s.id === selectedSeller)?.name}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-1 hover:bg-transparent"
                                    onClick={() => setSelectedSeller("all")}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        )}
                    </div>
                )}

                {/* Results Count */}
                <p className="text-sm text-muted-foreground">
                    {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
                </p>

                {/* Products Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <Card
                                key={product.id}
                                className="overflow-hidden border-border/50 hover:border-primary/50 transition-colors shadow-sm bg-card group cursor-pointer"
                                onClick={() => setSelectedProduct(product)}
                            >
                                <div className="aspect-video relative bg-muted overflow-hidden">
                                    {product.image ? (
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                            <ShoppingCart className="w-12 h-12 opacity-30 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 flex gap-1">
                                        <Badge variant="secondary" className="backdrop-blur-md bg-background/60 text-[10px] font-medium border-none px-2 shadow-sm">
                                            {product.seller?.name || "Vendeur"}
                                        </Badge>
                                    </div>
                                    <div className="absolute bottom-2 right-2">
                                        <div className="bg-primary/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                            {formatPrice(product.price)} KMF
                                        </div>
                                    </div>
                                    {/* Quick View Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 dark:group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="bg-background/95 dark:bg-card/95 backdrop-blur-md px-4 py-2.5 rounded-full flex items-center gap-2 text-sm font-semibold text-foreground shadow-xl border border-border/50">
                                            <Eye className="h-4 w-4 text-primary" />
                                            Voir détails
                                        </div>
                                    </div>
                                </div>
                                <CardHeader className="pb-2 space-y-1">
                                    <CardTitle className="text-base font-bold">{product.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 text-xs leading-relaxed">{product.description}</CardDescription>
                                </CardHeader>
                                <CardFooter className="pt-2">
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary font-semibold transition-all hover:gap-3"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            addToCart(product)
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Ajouter au panier
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-20 text-slate-500 bg-muted/20 border-2 border-dashed border-border/50 rounded-2xl">
                            <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-10" />
                            <p className="font-medium">
                                {products.length === 0 ? "Aucun produit disponible" : "Aucun produit ne correspond à vos filtres"}
                            </p>
                            {activeFiltersCount > 0 && (
                                <Button
                                    variant="link"
                                    className="mt-2 text-primary"
                                    onClick={() => {
                                        setSearchQuery("")
                                        setSelectedSeller("all")
                                    }}
                                >
                                    Réinitialiser les filtres
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Product Detail Modal */}
            <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogTitle className="sr-only">
                        {selectedProduct ? selectedProduct.name : "Détails du produit"}
                    </DialogTitle>
                    {selectedProduct && (
                        <>
                            {/* Product Image */}
                            <div className="aspect-video relative bg-muted">
                                {selectedProduct.image ? (
                                    <Image
                                        src={selectedProduct.image}
                                        alt={selectedProduct.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                                        <Package className="w-16 h-16 opacity-30" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3">
                                    <Badge className="backdrop-blur-md bg-background/80 text-foreground border-none shadow-lg">
                                        <Store className="h-3 w-3 mr-1" />
                                        {selectedProduct.seller?.name || "Vendeur"}
                                    </Badge>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 max-h-[50vh] overflow-y-auto">
                                <div className="p-6 space-y-4">
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                                        <p className="text-3xl font-bold text-primary mt-2">
                                            {formatPrice(selectedProduct.price)} KMF
                                        </p>
                                    </div>

                                    {selectedProduct.description && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                                Description
                                            </h3>
                                            <p className="text-sm text-foreground leading-relaxed">
                                                {selectedProduct.description}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 py-3 border-t border-b">
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Stock disponible</p>
                                            <p className="font-semibold">
                                                {selectedProduct.stock > 0 ? (
                                                    <span className="text-emerald-600">{selectedProduct.stock} unité(s)</span>
                                                ) : (
                                                    <span className="text-destructive">Rupture de stock</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Vendu par</p>
                                            <p className="font-semibold">{selectedProduct.seller?.name || "Vendeur"}</p>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            <DialogFooter className="p-4 border-t bg-muted/30">
                                <Button
                                    className="w-full gap-2 py-6 text-base font-bold"
                                    size="lg"
                                    onClick={() => {
                                        addToCart(selectedProduct)
                                        setSelectedProduct(null)
                                    }}
                                    disabled={selectedProduct.stock <= 0}
                                >
                                    <Plus className="h-5 w-5" />
                                    Ajouter au panier
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetContent side="right" className="w-screen sm:w-[540px] flex flex-col p-0">
                    <SheetHeader className="px-6 py-4 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-primary" />
                            Mon Panier
                            <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20">
                                {cart.reduce((a, b) => a + b.quantity, 0)} articles
                            </Badge>
                        </SheetTitle>
                        <SheetDescription>
                            Vérifiez votre commande et choisissez l'adresse de livraison.
                        </SheetDescription>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-6">
                        <div className="space-y-6 py-6">
                            {/* Cart Items */}
                            <div className="space-y-4">
                                {cart.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>Votre panier est vide</p>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="h-20 w-20 relative rounded-lg overflow-hidden bg-muted shrink-0 border">
                                                {item.image ? (
                                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ShoppingCart className="w-8 h-8 opacity-20" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                                <div>
                                                    <h4 className="font-bold text-sm truncate">{item.name}</h4>
                                                    <p className="text-sm font-semibold text-primary">{formatPrice(item.price * item.quantity)} KMF</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1 border rounded-md h-8 bg-background">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-full w-8 rounded-none border-r hover:bg-muted"
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-full w-8 rounded-none border-l hover:bg-muted"
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10 ml-auto"
                                                        onClick={() => removeFromCart(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Delivery Address Section */}
                            {cart.length > 0 && (
                                <div className="space-y-4 pt-4 border-t">
                                    <Label className="text-base font-bold">Lieu de livraison</Label>

                                    <div className="grid gap-3">
                                        {savedAddresses.map((addr) => (
                                            <div
                                                key={addr.id}
                                                onClick={() => {
                                                    setAddressMode("saved")
                                                    setSelectedSavedId(addr.id)
                                                }}
                                                className={`
                                                    relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                                    ${addressMode === "saved" && selectedSavedId === addr.id
                                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                        : "border-border hover:border-primary/50 bg-card"}
                                                `}
                                            >
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${addressMode === "saved" && selectedSavedId === addr.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate">{addr.label}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{addr.city} {addr.neighborhood ? `- ${addr.neighborhood}` : ""}</p>
                                                </div>
                                                {addressMode === "saved" && selectedSavedId === addr.id && (
                                                    <Check className="h-4 w-4 text-primary absolute top-3 right-3" />
                                                )}
                                            </div>
                                        ))}

                                        <div
                                            onClick={() => {
                                                setAddressMode("gps")
                                                setSelectedSavedId(null)
                                            }}
                                            className={`
                                                relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                                ${addressMode === "gps"
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                    : "border-border hover:border-primary/50 bg-card"}
                                            `}
                                        >
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${addressMode === "gps" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                                <Plus className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold">Autre emplacement</p>
                                                <p className="text-xs text-muted-foreground">Utiliser le GPS actuel</p>
                                            </div>
                                            {addressMode === "gps" && (
                                                <Check className="h-4 w-4 text-primary absolute top-3 right-3" />
                                            )}
                                        </div>
                                    </div>

                                    {/* GPS Options */}
                                    {addressMode === "gps" && (
                                        <div className="p-4 rounded-xl border border-dashed border-primary/20 bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-xs font-semibold">Nom de l'adresse (Requis pour enregistrer)</Label>
                                                <Input
                                                    value={newAddrLabel}
                                                    onChange={(e) => setNewAddrLabel(e.target.value)}
                                                    placeholder="Ex: Maison, Bureau..."
                                                    className="h-10 text-sm bg-background border-primary/20"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Save className="h-4 w-4 text-primary" />
                                                    <span className="text-xs font-medium text-muted-foreground">Sauvegarder ?</span>
                                                </div>
                                                <Switch
                                                    checked={shouldSaveAddress}
                                                    onCheckedChange={setShouldSaveAddress}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-6 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-muted-foreground font-medium">Total</span>
                            <span className="text-2xl font-bold text-primary">{formatPrice(total)} KMF</span>
                        </div>
                        <Button
                            className="w-full gap-2 py-6 text-base font-bold shadow-lg shadow-primary/20"
                            size="lg"
                            onClick={handleCheckout}
                            disabled={isCheckingOut || isLocating || cart.length === 0}
                        >
                            {isOffline ? (
                                <>
                                    <Save className="h-5 w-5" />
                                    Sauvegarder (Hors ligne)
                                </>
                            ) : isLocating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Localisation...
                                </>
                            ) : isCheckingOut ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Validation...
                                </>
                            ) : (
                                <>
                                    <Check className="h-5 w-5" />
                                    Confirmer la commande
                                </>
                            )}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Floating Cart Button Trigger */}
            {cart.length > 0 && !isCartOpen && (
                <div className="fixed bottom-24 right-4 z-40 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <Button
                        onClick={() => setIsCartOpen(true)}
                        size="lg"
                        className="h-14 px-6 rounded-full shadow-xl shadow-primary/30 flex items-center gap-3 border-2 border-white/20"
                    >
                        <div className="relative">
                            <ShoppingCart className="h-6 w-6" />
                            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-primary">
                                {cart.reduce((a, b) => a + b.quantity, 0)}
                            </span>
                        </div>
                        <div className="flex flex-col items-start leading-none">
                            <span className="font-bold text-base">Voir Panier</span>
                            <span className="text-xs opacity-90 font-medium">{formatPrice(total)} KMF</span>
                        </div>
                    </Button>
                </div>
            )}

            <BottomNav />
        </div>
    )
}
