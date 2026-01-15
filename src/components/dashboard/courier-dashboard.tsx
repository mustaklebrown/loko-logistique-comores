"use client";

import { motion } from "framer-motion";
import {
    Package,
    MapPin,
    Clock,
    CheckCircle,
    Navigation,
    Camera,
    LogOut,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { saveToOfflineStorage, OFFLINE_CACHE_KEYS } from "@/lib/offline-storage";

export interface CourierDashboardProps {
    user: {
        id: string;
        name: string;
        email: string;
        role?: string;
    };
    deliveries: any[];
}

const statusColors: Record<string, string> = {
    IN_TRANSIT: "from-blue-500 to-indigo-600",
    ASSIGNED: "from-purple-500 to-pink-600",
    ARRIVED_ZONE: "from-orange-500 to-red-600",
    DELIVERED: "from-emerald-500 to-teal-600",
};

const statusLabels: Record<string, string> = {
    IN_TRANSIT: "En cours",
    ASSIGNED: "À livrer",
    ARRIVED_ZONE: "Arrivé dans la zone",
    DELIVERED: "Livrée",
};

export function CourierDashboard({ user, deliveries }: CourierDashboardProps) {
    const router = useRouter();

    // Cache data for offline use
    useEffect(() => {
        if (deliveries) {
            saveToOfflineStorage(OFFLINE_CACHE_KEYS.DELIVERIES + '_courier', deliveries);
        }
    }, [deliveries]);

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
        router.refresh();
    };

    // Calculate stats
    const completedToday = deliveries.filter(d =>
        d.status === "DELIVERED" &&
        new Date(d.updatedAt).toDateString() === new Date().toDateString()
    ).length;

    const pendingDeliveries = deliveries.filter(d =>
        d.status === "ASSIGNED" || d.status === "IN_TRANSIT" || d.status === "ARRIVED_ZONE"
    ).length;

    const activeDeliveries = deliveries.filter(d =>
        d.status === "IN_TRANSIT" || d.status === "ARRIVED_ZONE"
    );

    const assignedOnly = deliveries.filter(d => d.status === "ASSIGNED");

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-lg mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-white font-bold">
                                    {user.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-foreground font-medium">{user.name}</p>
                                <p className="text-xs text-emerald-500">Coursier</p>
                            </div>
                        </div>
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
            </header>

            {/* Main Content */}
            <main className="max-w-lg mx-auto px-4 py-6 pb-96">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card backdrop-blur-xl border border-border/50 rounded-2xl p-4 text-center shadow-sm"
                    >
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{completedToday}</p>
                        <p className="text-sm text-muted-foreground">Livrées aujourd'hui</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card backdrop-blur-xl border border-border/50 rounded-2xl p-4 text-center shadow-sm"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                            <Package className="w-6 h-6 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{pendingDeliveries}</p>
                        <p className="text-sm text-muted-foreground">En cours / À livrer</p>
                    </motion.div>
                </div>

                {/* Active Deliveries (IN_TRANSIT or ARRIVED_ZONE) */}
                {activeDeliveries.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <h2 className="text-lg font-semibold text-foreground mb-3">Livraisons en cours</h2>
                        <div className="space-y-4">
                            {activeDeliveries.map(delivery => (
                                <div
                                    key={delivery.id}
                                    className="bg-linear-to-r from-blue-500/10 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-5"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-xl font-bold text-foreground truncate max-w-[150px]">{delivery.id.slice(0, 8)}...</p>
                                            <p className="text-primary/80 text-sm">{delivery.deliveryPoint?.description || "Sans description"}</p>
                                        </div>
                                        <span className={`px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase`}>
                                            {statusLabels[delivery.status] || delivery.status}
                                        </span>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <span className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                                                {delivery.deliveryPoint?.latitude.toFixed(4)}, {delivery.deliveryPoint?.longitude.toFixed(4)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <a
                                            href={`https://www.google.com/maps?q=${delivery.deliveryPoint?.latitude},${delivery.deliveryPoint?.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1"
                                        >
                                            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                                                <Navigation className="w-4 h-4 mr-2" />
                                                GPS
                                            </Button>
                                        </a>
                                        <Link href={`/deliveries/${delivery.id}`} className="flex-1">
                                            <Button className={`w-full text-white ${delivery.status === 'ARRIVED_ZONE' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                                                {delivery.status === 'ARRIVED_ZONE' ? (
                                                    <>
                                                        <Camera className="w-4 h-4 mr-2" />
                                                        Confirmer (Code)
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="w-4 h-4 mr-2" />
                                                        Gérer
                                                    </>
                                                )}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Assigned (Waiting) Deliveries */}
                {assignedOnly.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-foreground mb-3">À traiter</h2>
                        <div className="space-y-3">
                            {assignedOnly.map((delivery, index) => (
                                <motion.div
                                    key={delivery.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + index * 0.1 }}
                                    className="bg-card backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-sm"
                                >
                                    <Link href={`/deliveries/${delivery.id}`} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${statusColors[delivery.status] || 'from-gray-500 to-slate-600'} flex items-center justify-center`}>
                                                <Package className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-foreground truncate">#{delivery.id.slice(0, 8)}</p>
                                                <p className="text-sm text-muted-foreground truncate max-w-[150px]">{delivery.deliveryPoint?.description || "Point de livraison"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="ghost" className="text-muted-foreground">
                                                Détails <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {activeDeliveries.length === 0 && assignedOnly.length === 0 && (
                    <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border">
                        <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">Aucune livraison assignée pour le moment.</p>
                        <Link href="/deliveries">
                            <Button variant="link" className="text-emerald-400 mt-2">
                                Voir les livraisons disponibles
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Bottom Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 p-4">
                    <div className="max-w-lg mx-auto">
                        <Link href="/tracking">
                            <Button className="w-full bg-linear-to-r from-emerald-500 to-teal-600 hover:bg-emerald-600 py-6 text-lg shadow-lg shadow-emerald-500/20">
                                <MapPin className="w-5 h-5 mr-2" />
                                Ouvrir la Carte
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
