"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header, BottomNav } from "@/components/layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createDelivery } from "@/app/actions/delivery"
import { createSavedAddress } from "@/app/actions/saved-addresses"
import { MapPin, Navigation, Check, Loader2, Plus, ShoppingCart, Globe, User, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Image from "next/image"

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
    const [shouldSaveAddress, setShouldSaveAddress] = useState(false)
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

    const getModeLabel = () => {
        if (addressMode === "profile") return "Mon adresse profil"
        if (addressMode === "saved") {
            const addr = savedAddresses.find(a => a.id === selectedSavedId)
            return addr ? `Adresse: ${addr.label}` : "Choisir une adresse"
        }
        return "Position GPS actuelle"
    }

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
                                <span className="text-primary font-bold">{total.toLocaleString()} KMF</span>
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4 pb-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Lieu de livraison</Label>
                                <Select value={addressMode === "saved" ? `saved_${selectedSavedId}` : addressMode} onValueChange={(val) => {
                                    if (val === "gps") {
                                        setAddressMode("gps")
                                    } else if (val === "profile") {
                                        setAddressMode("profile")
                                    } else if (val.startsWith("saved_")) {
                                        setAddressMode("saved")
                                        setSelectedSavedId(val.replace("saved_", ""))
                                    }
                                }}>
                                    <SelectTrigger className="w-full h-14 rounded-xl bg-primary/5 border-primary/20 shadow-none focus:ring-primary/20 font-medium">
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                {addressMode === "gps" ? <Globe className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold leading-tight line-clamp-1">{getModeLabel()}</span>
                                                <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                                                    {addressMode === "profile" && `${user?.city || ""}, ${user?.neighborhood || ""}`}
                                                    {addressMode === "saved" && savedAddresses.find(a => a.id === selectedSavedId)?.city}
                                                    {addressMode === "gps" && "Utiliser ma position actuelle"}
                                                </span>
                                            </div>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                                        <SelectItem value="gps" className="py-3 focus:bg-primary/5 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Globe className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">Position GPS</span>
                                                    <span className="text-[10px] text-muted-foreground">Ma position actuelle (Précis)</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                        {user?.latitude && (
                                            <SelectItem value="profile" className="py-3 focus:bg-primary/5 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold">Mon Profil</span>
                                                        <span className="text-[10px] text-muted-foreground">{user.city}, {user.neighborhood}</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        )}
                                        {savedAddresses.map(addr => (
                                            <SelectItem key={addr.id} value={`saved_${addr.id}`} className="py-3 focus:bg-primary/5 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold">{addr.label}</span>
                                                        <span className="text-[10px] text-muted-foreground">{addr.city}, {addr.neighborhood}</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Option to save GPS address */}
                            {addressMode === "gps" && (
                                <div className="p-4 rounded-xl border border-dashed border-primary/20 bg-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Save className="h-3 w-3 text-primary" />
                                            <span className="text-[11px] font-bold text-primary uppercase">Enregistrer cette position ?</span>
                                        </div>
                                        <Switch
                                            checked={shouldSaveAddress}
                                            onCheckedChange={setShouldSaveAddress}
                                        />
                                    </div>
                                    {shouldSaveAddress && (
                                        <Input
                                            value={newAddrLabel}
                                            onChange={(e) => setNewAddrLabel(e.target.value)}
                                            placeholder="Nom (ex: Bureau, Chez Ami...)"
                                            className="h-10 text-xs bg-background border-primary/20 rounded-lg focus-visible:ring-primary/20"
                                        />
                                    )}
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
                                            {product.price.toLocaleString()} KMF
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
