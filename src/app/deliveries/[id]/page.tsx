import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, User, Clock, CheckCircle2, Camera, Phone, Navigation, ShoppingBag, Key } from "lucide-react"
import { Header, BottomNav } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getDelivery } from "@/app/actions/delivery"
import { getSession } from "@/lib/auth-server"
import { cn } from "@/lib/utils"
import { StatusActions } from "@/components/delivery/status-actions"
import { AssignCourierForm } from "@/components/delivery/assign-courier-form"
import { ProofOfDeliveryForm } from "@/components/delivery/proof-of-delivery-form"
import Image from "next/image"

const statusConfig = {
    CREATED: { label: "Créée", color: "bg-muted text-muted-foreground" },
    ASSIGNED: { label: "Assignée", color: "bg-blue-100 text-blue-700" },
    IN_TRANSIT: { label: "En transit", color: "bg-amber-100 text-amber-700" },
    ARRIVED_ZONE: { label: "Arrivée zone", color: "bg-purple-100 text-purple-700" },
    DELIVERED: { label: "Livrée", color: "bg-emerald-100 text-emerald-700" },
    FAILED: { label: "Échouée", color: "bg-red-100 text-red-700" },
}

export default async function DeliveryDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const session = await getSession()
    const result = await getDelivery(id)

    if (result.error || !result.delivery) {
        notFound()
    }

    const delivery = result.delivery
    const status = statusConfig[delivery.status as keyof typeof statusConfig]
    const isClient = session?.user.id === delivery.clientId
    const items = (delivery.items as any[]) || []

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Custom Header with Back Button */}
            <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-14 max-w-lg items-center px-4 gap-3">
                    <Link href="/deliveries">
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-semibold truncate">Détails livraison</h1>
                        <p className="text-xs text-muted-foreground truncate">#{delivery.id.slice(0, 8)}</p>
                    </div>
                    <Badge className={cn("shrink-0", status.color)}>
                        {status.label}
                    </Badge>
                </div>
            </header>

            <main className="mx-auto max-w-lg px-4 py-4 space-y-4">
                {/* Confirmation Code Card (Client Only) */}
                {isClient && delivery.status !== 'DELIVERED' && delivery.status !== 'FAILED' && delivery.confirmationCode && (
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center justify-center gap-2 text-primary">
                                <Key className="h-4 w-4" />
                                Code de Confirmation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold tracking-[0.2em] text-center text-primary font-mono">
                                {delivery.confirmationCode}
                            </div>
                            <p className="text-xs text-center text-muted-foreground mt-2">
                                Communiquez ce code au coursier lors de la réception pour valider la livraison.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Products Card */}
                {items.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-primary" />
                                Produits commandés
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {items.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                                        <div className="flex items-center gap-3">
                                            {item.image && (
                                                <div className="h-10 w-10 relative rounded bg-muted/50 overflow-hidden">
                                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">Qté: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold">{item.price} €</p>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 font-bold">
                                    <span>Total</span>
                                    <span>{items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)} €</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Locations Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {delivery.pickupPoint && (
                        <Card className="border-primary/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2 text-primary">
                                    <ShoppingBag className="h-4 w-4" />
                                    Point de collecte (Vendeur)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm font-medium">
                                    {delivery.pickupPoint.description || "Pas de description"}
                                </p>
                                <div className="flex gap-2 text-[10px] text-muted-foreground font-mono">
                                    <span>{delivery.pickupPoint.latitude.toFixed(6)}, {delivery.pickupPoint.longitude.toFixed(6)}</span>
                                </div>
                                <a
                                    href={`https://www.google.com/maps?q=${delivery.pickupPoint.latitude},${delivery.pickupPoint.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                                        <Navigation className="h-3 w-3" />
                                        Y aller pour le pickup
                                    </Button>
                                </a>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Point de livraison
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm font-medium">
                                {delivery.deliveryPoint?.description || "Pas de description"}
                            </p>
                            <div className="flex gap-2 text-[10px] text-muted-foreground font-mono">
                                <span>{delivery.deliveryPoint?.latitude.toFixed(6)}, {delivery.deliveryPoint?.longitude.toFixed(6)}</span>
                            </div>
                            <a
                                href={`https://www.google.com/maps?q=${delivery.deliveryPoint?.latitude},${delivery.deliveryPoint?.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                                    <Navigation className="h-3 w-3" />
                                    Ouvrir dans Maps
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                </div>

                {/* Receiver (Client) Card */}
                <Card className={cn(delivery.courierId === session?.user.id ? "border-primary/50 bg-primary/5 shadow-md" : "")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight text-muted-foreground">
                            <User className="h-4 w-4" />
                            Destinataire (Client)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-black">
                                    {(delivery as any).client?.name?.charAt(0) || "U"}
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-bold text-base">{(delivery as any).client?.name || "Client"}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                        <MapPin className="h-3 w-3" />
                                        <span>{(delivery as any).client?.city || "Zone inconnue"} - {(delivery as any).client?.neighborhood || "Quartier"}</span>
                                    </div>
                                </div>
                            </div>
                            {(delivery.courierId === session?.user.id || session?.user.role === 'admin' || isClient) && (delivery as any).client?.phone && (
                                <a href={`tel:${(delivery as any).client.phone}`}>
                                    <Button variant="default" size="icon" className="h-10 w-10 rounded-full shadow-lg">
                                        <Phone className="h-4 w-4" />
                                    </Button>
                                </a>
                            )}
                        </div>

                        {/* Detailed Address (Only after accept) */}
                        <div className="pt-2 border-t border-border/50">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Adresse Précise</p>
                            {(delivery.courierId === session?.user.id || session?.user.role === 'admin' || isClient) ? (
                                <div className="p-3 rounded-lg bg-background border border-primary/20 space-y-1">
                                    <p className="text-sm font-medium leading-tight">
                                        {(delivery as any).client?.landmark || delivery.deliveryPoint?.description || "Pas de repère précis"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Coordonnées GPS disponibles ci-dessous
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-dashed text-muted-foreground italic">
                                    <Clock className="h-4 w-4 opacity-50" />
                                    <p className="text-xs">Acceptez la course pour voir l'adresse complète et le repère.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Courier Card (If assigned) */}
                {delivery.courier && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Navigation className="h-4 w-4 text-primary" />
                                Coursier Assigné
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                        {delivery.courier.name?.charAt(0) || "C"}
                                    </div>
                                    <div>
                                        <p className="font-medium">{delivery.courier.name}</p>
                                        <p className="text-xs text-muted-foreground">{delivery.courier.email}</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="icon" className="rounded-full">
                                    <Phone className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Assignment Form (If NOT assigned and user is courier/admin) */}
                {!delivery.courier && (
                    <Card className="border-primary/30 bg-primary/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-primary">
                                <User className="h-4 w-4" />
                                Assignation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AssignCourierForm
                                deliveryId={delivery.id}
                                currentUserId={session?.user.id}
                                userRole={session?.user.role || undefined}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Timeline Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            Historique
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(delivery as any).logs && (delivery as any).logs.length > 0 ? (
                                (delivery as any).logs.map((log: any) => (
                                    <TimelineItem
                                        key={log.id}
                                        label={log.details || log.action}
                                        time={new Date(log.createdAt).toLocaleString("fr-FR")}
                                        completed
                                        user={log.user?.name}
                                    />
                                ))
                            ) : (
                                <>
                                    <TimelineItem
                                        label="Créée"
                                        time={new Date(delivery.createdAt).toLocaleString("fr-FR")}
                                        completed
                                    />
                                    {delivery.courier && (
                                        <TimelineItem
                                            label="Assignée"
                                            time="Coursier assigné"
                                            completed
                                        />
                                    )}
                                    {(delivery.status === "IN_TRANSIT" || delivery.status === "ARRIVED_ZONE" || delivery.status === "DELIVERED") && (
                                        <TimelineItem
                                            label="En transit"
                                            time="Livraison démarrée"
                                            completed
                                        />
                                    )}
                                    {(delivery.status === "ARRIVED_ZONE" || delivery.status === "DELIVERED") && (
                                        <TimelineItem
                                            label="Arrivée zone"
                                            time="Dans la zone"
                                            completed
                                        />
                                    )}
                                    {delivery.status === "DELIVERED" && delivery.proof && (
                                        <TimelineItem
                                            label="Livrée"
                                            time={new Date(delivery.proof.deliveredAt).toLocaleString("fr-FR")}
                                            completed
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Proof of Delivery Card (shown when completed) */}
                {delivery.proof && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                Preuve de livraison
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {delivery.proof.photoUrl && (
                                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                                    <Camera className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                            <div className="text-sm space-y-1">
                                <p>📍 GPS: {delivery.proof.latitude.toFixed(6)}, {delivery.proof.longitude.toFixed(6)}</p>
                                {delivery.proof.signature && (
                                    <p>✍️ Signature: Vérifié</p>
                                )}
                                {delivery.proof.otp && (
                                    <p>🔑 Code OTP: Vérifié</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Status Actions - Show next step button */}
                {/* Available for courier to pick up or move to zone */}
                {delivery.status !== "DELIVERED" && delivery.status !== "FAILED" && delivery.status !== "ARRIVED_ZONE" && delivery.courier && (
                    <StatusActions deliveryId={delivery.id} currentStatus={delivery.status} />
                )}

                {/* Proof of Delivery Form - Show when courier arrived */}
                {delivery.status === "ARRIVED_ZONE" && (
                    <ProofOfDeliveryForm deliveryId={delivery.id} />
                )}
            </main>

            <BottomNav />
        </div>
    )
}

function TimelineItem({
    label,
    time,
    completed = false,
    user,
}: {
    label: string
    time: string
    completed?: boolean
    user?: string
}) {
    return (
        <div className="flex items-center gap-3">
            <div
                className={cn(
                    "h-2 w-2 rounded-full",
                    completed ? "bg-primary" : "bg-muted"
                )}
            />
            <div className="flex-1">
                <p className={cn("text-sm font-medium", !completed && "text-muted-foreground")}>
                    {label}
                </p>
                {user && <p className="text-xs text-muted-foreground">Par: {user}</p>}
            </div>
            <p className="text-xs text-muted-foreground">{time}</p>
        </div>
    )
}
