"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Loader2, User, Clock, Settings, HelpCircle, Save, Bell, Map as MapIcon, Navigation, Trash2 } from "lucide-react"
import { updateUser } from "@/app/actions/users"
import { Map } from "@/components/map"
import { createSavedAddress, deleteSavedAddress } from "@/app/actions/saved-addresses"

interface ProfileTabsProps {
    user: any
    logs: any[]
    savedAddresses?: any[]
}

export function ProfileTabs({ user, logs, savedAddresses: initialAddresses = [] }: ProfileTabsProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [name, setName] = useState(user.name || "")
    const [phone, setPhone] = useState(user.phone || "")

    // Saved addresses management
    const [addresses, setAddresses] = useState(initialAddresses)
    const [isSavingAddress, setIsSavingAddress] = useState(false)
    const [newAddrLabel, setNewAddrLabel] = useState("")


    // Address state (Main profile address)
    const [city, setCity] = useState(user.city || "")
    const [neighborhood, setNeighborhood] = useState(user.neighborhood || "")
    const [landmark, setLandmark] = useState(user.landmark || "")
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(
        user.latitude && user.longitude ? { lat: user.latitude, lng: user.longitude } : null
    )

    const router = useRouter()

    async function handleSaveNewAddress() {
        if (!location) {
            toast.error("Veuillez choisir une position sur la carte");
            return;
        }
        if (!newAddrLabel) {
            toast.error("Veuillez donner un nom à cette adresse (ex: Maison, Bureau)");
            return;
        }

        setIsSavingAddress(true);
        const loadingToast = toast.loading("Enregistrement de l'adresse...");

        try {
            const res = await createSavedAddress({
                label: newAddrLabel,
                city: city || "Moroni",
                neighborhood: neighborhood || "Centre-ville",
                landmark: landmark || "",
                latitude: location.lat,
                longitude: location.lng
            });

            toast.dismiss(loadingToast);

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Adresse enregistrée avec succès !");
                setNewAddrLabel("");
                if (res.success && res.address) {
                    setAddresses(prev => [res.address, ...prev]);
                }
                router.refresh();
            }
        } catch (e) {
            console.error("handleSaveNewAddress error:", e);
            toast.dismiss(loadingToast);
            toast.error("Une erreur réseau est survenue lors de la sauvegarde");
        } finally {
            setIsSavingAddress(false);
        }
    }

    async function handleDeleteAddress(id: string) {
        const res = await deleteSavedAddress(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Adresse supprimée")
            setAddresses(addresses.filter(a => a.id !== id))
        }
    }

    async function handleUpdateProfile() {
        setIsUpdating(true)
        try {
            const res = await updateUser({
                name,
                phone,
                city,
                neighborhood,
                landmark,
                latitude: location?.lat,
                longitude: location?.lng
            })
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Profil mis à jour")
                router.refresh()
            }
        } catch (e) {
            toast.error("Erreur inconnue")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleLocationSelect = (lat: number, lng: number) => {
        setLocation({ lat, lng })
    }

    const handleGetCurrentLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
                toast.success("Position actuelle récupérée")
            })
        }
    }

    return (
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid h-12 w-full grid-cols-5 mb-6 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><User className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="address" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><MapPin className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Clock className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Settings className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="faq" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><HelpCircle className="h-4 w-4" /></TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
                <div className="space-y-4 p-5 border border-border/50 rounded-2xl bg-card text-card-foreground shadow-sm">
                    <h3 className="text-lg font-bold">Informations personnelles</h3>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nom complet</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background/50 border-border/50 h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</Label>
                        <Input value={user.email} disabled className="bg-muted/30 border-border/50 h-12 rounded-xl opacity-60" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Téléphone</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+269..." className="bg-background/50 border-border/50 h-12 rounded-xl" />
                    </div>
                    <Button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full py-7 font-bold text-base shadow-lg shadow-primary/20">
                        {isUpdating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                        Enregistrer les modifications
                    </Button>
                </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-6">
                {/* Main Address Section */}
                <div className="space-y-4 p-5 border border-border/50 rounded-2xl bg-card text-card-foreground shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <MapIcon className="h-24 w-24" />
                    </div>

                    <div className="flex items-center justify-between relative">
                        <div>
                            <h3 className="text-lg font-bold">Adresse Principale</h3>
                            <p className="text-[10px] text-muted-foreground">Utilisée par défaut pour vos commandes</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleGetCurrentLocation} className="text-[10px] h-8 font-bold border-primary/20 text-primary hover:bg-primary/5">
                            <Navigation className="h-3 w-3 mr-1" />
                            GPS
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 relative">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ville / Village</Label>
                            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Moroni" className="bg-background/50 border-border/50 h-10 rounded-lg text-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quartier</Label>
                            <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Ex: Oasis" className="bg-background/50 border-border/50 h-10 rounded-lg text-sm" />
                        </div>
                    </div>

                    <div className="space-y-2 relative">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Point de repères (Ex: Pharmacie...)</Label>
                        <Input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Détails pour aider le coursier..." className="bg-background/50 border-border/50 h-10 rounded-lg text-sm" />
                    </div>

                    <div className="space-y-2 relative">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Localisation GPS précise</Label>
                        <div className="h-[220px] w-full rounded-xl overflow-hidden border border-border relative shadow-inner">
                            <Map
                                center={location ? [location.lat, location.lng] : undefined}
                                markers={location ? [{ ...location, description: "Votre adresse" }] : []}
                                onLocationSelect={handleLocationSelect}
                            />
                            {!location && (
                                <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
                                    <MapPin className="h-8 w-8 text-primary/40 mb-2" />
                                    <p className="text-xs font-bold text-foreground">Cliquez sur la carte</p>
                                    <p className="text-[10px] text-muted-foreground">Définissez votre position exacte</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <Button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full py-6 font-bold text-sm shadow-md">
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Mettre à jour l'adresse principale
                        </Button>

                        <div className="pt-2 border-t border-border/50 mt-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Enregistrer comme nouvelle adresse ?</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    value={newAddrLabel}
                                    onChange={(e) => setNewAddrLabel(e.target.value)}
                                    placeholder="Nom (ex: Maison, Bureau...)"
                                    className="h-10 text-xs rounded-lg"
                                />
                                <Button
                                    variant="secondary"
                                    onClick={handleSaveNewAddress}
                                    disabled={isSavingAddress}
                                    className="h-10 px-4 font-bold text-xs"
                                >
                                    {isSavingAddress ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                                    Enregistrer
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Saved Addresses List */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold px-1 flex items-center gap-2">
                        <MapIcon className="h-4 w-4 text-primary" />
                        Mes adresses enregistrées ({addresses.length})
                    </h4>

                    <div className="grid gap-3">
                        {addresses.length > 0 ? (
                            addresses.map((addr) => (
                                <div key={addr.id} className="p-4 border border-border/50 rounded-2xl bg-card hover:border-primary/30 transition-all flex items-center justify-between group shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                                            <MapPin className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{addr.label || "Adresse sans nom"}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {addr.city || "Ville non précisée"}, {addr.neighborhood || "Quartier non précisé"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setCity(addr.city || "");
                                                setNeighborhood(addr.neighborhood || "");
                                                setLandmark(addr.landmark || "");
                                                setLocation({ lat: addr.latitude, lng: addr.longitude });
                                                toast.success(`Sélectionné: ${addr.label}`);
                                            }}
                                            className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                                        >
                                            <Navigation className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteAddress(addr.id)}
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center border border-dashed border-border rounded-2xl bg-muted/20">
                                <p className="text-xs text-muted-foreground font-medium">Aucune adresse enregistrée</p>
                            </div>
                        )}
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium px-1">Activité récente</h3>
                    {logs.length > 0 ? (
                        <div className="border rounded-lg bg-card divide-y">
                            {logs.map((log) => (
                                <div key={log.id} className="p-4 flex gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Clock className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{log.details || log.action}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(log.createdAt).toLocaleString("fr-FR")}
                                            {log.delivery && ` • Livraison #${log.delivery.id.slice(0, 6)}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Aucune activité récente
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4 p-4 border rounded-lg bg-card">
                    <h3 className="text-lg font-medium">Préférences</h3>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Notifications Push</Label>
                            <p className="text-sm text-muted-foreground">Recevoir des alertes pour vos livraisons</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">SMS</Label>
                            <p className="text-sm text-muted-foreground">Recevoir les codes par SMS</p>
                        </div>
                        <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Mode sombre</Label>
                            <p className="text-sm text-muted-foreground">Thème de l'application</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Comment suivre ma livraison ?</AccordionTrigger>
                        <AccordionContent>
                            Vous pouvez suivre votre livraison en temps réel depuis votre tableau de bord ou la page de détails de la commande.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Comment contacter le coursier ?</AccordionTrigger>
                        <AccordionContent>
                            Une fois la livraison acceptée, un bouton d'appel est disponible sur la fiche de la livraison.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>Puis-je annuler ma commande ?</AccordionTrigger>
                        <AccordionContent>
                            Oui, tant que la commande n'a pas été prise en charge par un coursier (statut "Créée").
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </TabsContent>
        </Tabs>
    )
}
