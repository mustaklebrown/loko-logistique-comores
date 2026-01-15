"use client";

import { motion } from "framer-motion";
import {
    Package,
    MapPin,
    Clock,
    CheckCircle,
    Plus,
    Eye,
    LogOut,
    Truck,
    Trash2,
    Loader2,
    Home
} from "lucide-react";
import { deleteDelivery } from "@/app/actions/delivery";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveToOfflineStorage, getFromOfflineStorage, OFFLINE_CACHE_KEYS } from "@/lib/offline-storage";
import { useOffline } from "@/hooks/use-offline";

interface ClientDashboardProps {
    user: {
        id: string;
        name: string;
        email: string;
        role?: string;
    };
    deliveries: any[];
}

const statusColors: Record<string, string> = {
    DELIVERED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    IN_TRANSIT: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    ASSIGNED: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    CREATED: "text-slate-400 bg-slate-500/10 border-slate-500/30",
    FAILED: "text-red-400 bg-red-500/10 border-red-500/30",
};

const statusLabels: Record<string, string> = {
    DELIVERED: "Livré",
    IN_TRANSIT: "En cours",
    ASSIGNED: "Assigné",
    CREATED: "En attente",
    FAILED: "Échec",
};

const statusIcons: Record<string, typeof CheckCircle> = {
    DELIVERED: CheckCircle,
    IN_TRANSIT: Truck,
    ASSIGNED: MapPin,
    CREATED: Clock,
    FAILED: LogOut,
};

export function ClientDashboard({ user, deliveries }: ClientDashboardProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [localDeliveries, setLocalDeliveries] = useState(deliveries);
    const isOffline = useOffline();

    // Cache data for offline use or load from cache
    useEffect(() => {
        if (deliveries && deliveries.length > 0) {
            setLocalDeliveries(deliveries);
            saveToOfflineStorage(OFFLINE_CACHE_KEYS.DELIVERIES + '_client', deliveries);
        } else if (deliveries.length === 0) {
            // Try to load from cache if server returns empty (potential offline mode)
            const cached = getFromOfflineStorage<any[]>(OFFLINE_CACHE_KEYS.DELIVERIES + '_client');
            if (cached && cached.length > 0) {
                setLocalDeliveries(cached);
                if (!isOffline) {
                    toast("Données chargées depuis le cache local");
                }
            }
        }
    }, [deliveries, isOffline]);

    const activeDeliveries = localDeliveries; // Use localDeliveries instead of deliveries prop below

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
        router.refresh();
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        const res = await deleteDelivery(id);
        if (res.success) {
            toast.success("Livraison annulée avec succès");
        } else {
            toast.error(res.error || "Erreur lors de l'annulation");
        }
        setIsDeleting(null);
    };

    const deliveredCount = activeDeliveries.filter(d => d.status === "DELIVERED").length;
    const pendingCount = activeDeliveries.filter(d => d.status !== "DELIVERED").length;

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <Truck className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-foreground">
                                Loko<span className="text-emerald-500">.</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-foreground font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            <Link href="/">
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                    <Home className="w-5 h-5" />
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSignOut}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 py-6">
                {/* Welcome */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Bonjour, {user.name?.split(" ")[0]}! 👋
                    </h1>
                    <p className="text-muted-foreground">Gérez vos livraisons en toute simplicité.</p>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-sm text-muted-foreground">Livrées</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{deliveredCount}</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-sm text-muted-foreground">En cours</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
                    </motion.div>
                </div>

                {/* Deliveries List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Mes Livraisons</h2>
                        <Link href="/deliveries">
                            <Button variant="ghost" size="sm" className="text-emerald-500 hover:text-emerald-600">
                                Voir tout
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {deliveries.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                Aucune livraison pour le moment
                            </div>
                        )}
                        {deliveries.map((delivery, index) => {
                            const StatusIcon = statusIcons[delivery.status] || Clock;
                            const statusColor = statusColors[delivery.status] || statusColors.CREATED;
                            const statusLabel = statusLabels[delivery.status] || delivery.status;

                            return (
                                <motion.div
                                    key={delivery.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    className="bg-card backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${statusColor}`}>
                                                <StatusIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground truncate max-w-[150px]">{delivery.deliveryPoint?.description || "Livraison"}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(delivery.createdAt).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground text-[10px] uppercase font-mono">
                                            ID: {delivery.id.slice(0, 8)}
                                        </span>
                                        <div className="flex gap-2">
                                            {delivery.status === "CREATED" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive/80 h-8 px-2 hover:bg-destructive/10"
                                                    onClick={() => handleDelete(delivery.id)}
                                                    disabled={isDeleting === delivery.id}
                                                >
                                                    {isDeleting === delivery.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Trash2 className="w-4 h-4 mr-1" />
                                                            Annuler
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            {delivery.status === "ARRIVED_ZONE" && (
                                                <Link href={`/deliveries/${delivery.id}`}>
                                                    <Button variant="ghost" size="sm" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 h-8 px-3 border border-emerald-500/20">
                                                        <span className="mr-2">🔑</span>
                                                        Voir Code
                                                    </Button>
                                                </Link>
                                            )}
                                            {delivery.status !== "DELIVERED" && delivery.status !== "CREATED" && delivery.status !== "ARRIVED_ZONE" && (
                                                <Link href={`/tracking/${delivery.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-8 px-2">
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        Suivre
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 p-4 z-50">
                <div className="max-w-2xl mx-auto">
                    <Link href="/shop">
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg font-bold shadow-lg shadow-primary/20">
                            <Plus className="w-5 h-5 mr-2" />
                            Nouvelle Commande
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
