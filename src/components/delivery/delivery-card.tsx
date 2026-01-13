import Link from "next/link"
import { Package, MapPin, Truck, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusConfig = {
    CREATED: { label: "Créée", icon: Clock, color: "bg-muted text-muted-foreground" },
    ASSIGNED: { label: "Assignée", icon: Package, color: "bg-blue-500/10 text-blue-500" },
    IN_TRANSIT: { label: "En transit", icon: Truck, color: "bg-amber-500/10 text-amber-500" },
    ARRIVED_ZONE: { label: "Arrivée zone", icon: MapPin, color: "bg-purple-500/10 text-purple-500" },
    DELIVERED: { label: "Livrée", icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-500" },
    FAILED: { label: "Échouée", icon: AlertCircle, color: "bg-destructive/10 text-destructive" },
}

interface DeliveryCardProps {
    id: string
    status: keyof typeof statusConfig
    description?: string | null
    courierName?: string | null
    createdAt: string | Date
    latitude?: number
    longitude?: number
}

export function DeliveryCard({
    id,
    status,
    description,
    courierName,
    createdAt,
}: DeliveryCardProps) {
    const config = statusConfig[status]
    const StatusIcon = config.icon
    const date = new Date(createdAt)
    const formattedDate = date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    })

    return (
        <Link href={`/deliveries/${id}`}>
            <Card className="group transition-all hover:shadow-md hover:border-primary/20 active:scale-[0.98]">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className={cn("gap-1 text-xs font-medium", config.color)}>
                                    <StatusIcon className="h-3 w-3" />
                                    {config.label}
                                </Badge>
                            </div>
                            <p className="text-sm font-medium text-foreground truncate">
                                {description || "Livraison sans description"}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span>{formattedDate}</span>
                                {courierName && (
                                    <>
                                        <span>•</span>
                                        <span className="truncate">{courierName}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Package className="h-5 w-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
