"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header, BottomNav } from "@/components/layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createDelivery } from "@/app/actions/delivery"
import { createSavedAddress } from "@/app/actions/saved-addresses"
import { MapPin, Check, Loader2, Plus, ShoppingCart, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Image from "next/image"

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

    const handleCheckout = async () => {
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
                router.push(`/deliveries/${result.deliveryId}`)
            }
        } catch (error) {
            toast.error("Erreur serveur")
        } finally {
            setIsCheckingOut(false)
        }
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)


    return (
        <div className="min-h-screen bg-background pb-24">
            <Header title="Boutique en ligne" />

            <main className="container max-w-lg mx-auto p-4 space-y-6">


                {/* Cart Summary if items exist */}
                {cart.length > 0 && (
                    <Card className="sticky top-16 z-30 shadow-lg border-primary/20 bg-background/95 backdrop-blur-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex justify-between items-center text-lg">
                                <span className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5 text-primary" />
                                    Panier ({cart.reduce((a, b) => a + b.quantity, 0)})
                                </span>
                                <span className="text-primary font-bold">{formatPrice(total)} KMF</span>
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4 pb-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                    Lieu de livraison
                                </Label>

                                <div className="grid gap-2">
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
                                                    : "border-border hover:border-primary/50 bg-card/50"}
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
                                                : "border-border hover:border-primary/50 bg-card/50"}
                                        `}
                                    >
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${addressMode === "gps" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                            <Plus className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">Nouvelle / Autre Adresse</p>
                                            <p className="text-xs text-muted-foreground">Utiliser position GPS actuelle</p>
                                        </div>
                                        {addressMode === "gps" && (
                                            <Check className="h-4 w-4 text-primary absolute top-3 right-3" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Option to save GPS address */}
                            {addressMode === "gps" && (
                                <div className="p-4 rounded-xl border border-dashed border-primary/20 bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-xs font-semibold">Nom de l'adresse (Requis pour enregistrer)</Label>
                                        <Input
                                            value={newAddrLabel}
                                            onChange={(e) => setNewAddrLabel(e.target.value)}
                                            placeholder="Ex: Maison, Bureau, Chez Maman..."
                                            className="h-10 text-sm bg-background border-primary/20 rounded-lg focus-visible:ring-primary/20"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Save className="h-4 w-4 text-primary" />
                                            <span className="text-xs font-medium text-muted-foreground">Sauvegarder pour la prochaine fois ?</span>
                                        </div>
                                        <Switch
                                            checked={shouldSaveAddress}
                                            onCheckedChange={setShouldSaveAddress}
                                        />
                                    </div>
                                </div>
                            )}

                            <p className="text-[10px] text-muted-foreground text-center italic opacity-80">
                                {addressMode === "gps" ? "Votre navigateur demandera l'accès au GPS" : "Délai de livraison estimé: 30-45 min"}
                            </p>
                        </CardContent>

                        <CardFooter>
                            <Button
                                className="w-full gap-2 py-7 text-base font-bold shadow-lg shadow-primary/20 rounded-xl"
                                size="lg"
                                onClick={handleCheckout}
                                disabled={isCheckingOut || isLocating}
                            >
                                {isLocating ? (
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
                                        <ShoppingCart className="h-5 w-5" />
                                        Commander & Livrer ici
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {products.length > 0 ? (
                        products.map((product) => (
                            <Card key={product.id} className="overflow-hidden border-border/50 hover:border-primary/50 transition-colors shadow-sm bg-card group">
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
                                        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                                            <ShoppingCart className="w-12 h-12 opacity-30" />
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
                                </div>
                                <CardHeader className="pb-2 space-y-1">
                                    <CardTitle className="text-base font-bold">{product.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 text-xs leading-relaxed">{product.description}</CardDescription>
                                </CardHeader>
                                <CardFooter className="pt-2">
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary font-semibold transition-all hover:gap-3"
                                        onClick={() => addToCart(product)}
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
                            <p className="font-medium">Aucun produit disponible</p>
                        </div>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    )
}
