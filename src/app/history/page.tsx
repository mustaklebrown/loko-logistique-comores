import { getUserLogs } from "@/app/actions/users"
import { Header, BottomNav } from "@/components/layout"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Package, MapPin, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export default async function HistoryPage() {
    const result = await getUserLogs()
    const logs = result.success ? result.logs : []

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Historique" />
            <main className="max-w-lg mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Votre Activité</h1>
                    <p className="text-muted-foreground mt-1">Suivi de vos livraisons et actions récentes</p>
                </div>

                <div className="space-y-4">
                    {logs.length > 0 ? (
                        logs.map((log) => (
                            <Card key={log.id} className="bg-card border-border shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${log.action === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500' :
                                                log.action === 'CREATED' ? 'bg-primary/10 text-primary' :
                                                    'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {log.action === 'DELIVERED' ? <CheckCircle2 className="h-4 w-4" /> :
                                                log.action === 'CREATED' ? <Package className="h-4 w-4" /> :
                                                    <Clock className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-semibold text-foreground text-sm">
                                                    {log.action === 'CREATED' ? 'Nouvelle Livraison' :
                                                        log.action === 'DELIVERED' ? 'Livraison Terminée' :
                                                            log.action === 'ASSIGNED' ? 'Coursier Assigné' :
                                                                log.action === 'STATUS_UPDATE' ? 'Statut Mis à Jour' :
                                                                    log.action}
                                                </h3>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: fr })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {log.details}
                                            </p>
                                            {log.delivery && (
                                                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-primary">
                                                    <Package className="h-3 w-3" />
                                                    <span>#{log.delivery.id.slice(0, 8)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
                            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">Aucune activité récente</p>
                        </div>
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    )
}
