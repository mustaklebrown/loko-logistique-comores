"use client"

import { Package, Truck, CheckCircle2, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ComponentType<{ className?: string }>
    trend?: number
    variant?: "default" | "primary" | "success" | "warning"
}

const variantStyles = {
    default: "bg-muted/50 text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-500",
    warning: "bg-amber-500/10 text-amber-500",
}

export function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    variant = "default",
}: StatsCardProps) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {title}
                        </p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                        )}
                        {trend !== undefined && (
                            <div className={cn(
                                "flex items-center gap-1 text-xs font-medium mt-2",
                                trend >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                                <TrendingUp className={cn("h-3 w-3", trend < 0 && "rotate-180")} />
                                <span>{Math.abs(trend)}% vs hier</span>
                            </div>
                        )}
                    </div>
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", variantStyles[variant])}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface DashboardStatsProps {
    stats: {
        total: number
        inTransit: number
        delivered: number
        pending: number
    }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <StatsCard
                title="Total"
                value={stats.total}
                subtitle="Livraisons"
                icon={Package}
                variant="primary"
            />
            <StatsCard
                title="En transit"
                value={stats.inTransit}
                subtitle="En cours"
                icon={Truck}
                variant="warning"
            />
            <StatsCard
                title="Livrées"
                value={stats.delivered}
                subtitle="Aujourd'hui"
                icon={CheckCircle2}
                variant="success"
                trend={12}
            />
            <StatsCard
                title="En attente"
                value={stats.pending}
                subtitle="À assigner"
                icon={Clock}
            />
        </div>
    )
}
