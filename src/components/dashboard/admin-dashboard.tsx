"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Package,
    Users,
    Truck,
    MapPin,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    LogOut,
    Search,
    Home,
    ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateUserRole } from "@/app/actions/users";
import { toast } from "sonner";

interface AdminDashboardProps {
    user: {
        id: string;
        name: string;
        email: string;
        role?: string;
    };
    users?: any[];
}

const statusColors: Record<string, string> = {
    DELIVERED: "text-emerald-500 bg-emerald-500/10",
    IN_TRANSIT: "text-blue-500 bg-blue-500/10",
    ASSIGNED: "text-purple-500 bg-purple-500/10",
    CREATED: "text-muted-foreground bg-muted",
};

const statusLabels: Record<string, string> = {
    DELIVERED: "Livré",
    IN_TRANSIT: "En cours",
    ASSIGNED: "Assigné",
    CREATED: "Créé",
};

export function AdminDashboard({ user, users = [], stats, recentDeliveries = [] }: AdminDashboardProps & {
    stats?: {
        totalDeliveries: number;
        activeCouriers: number;
        deliveryPoints: number;
        totalClients: number;
    },
    recentDeliveries?: any[];
}) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredUsers, setFilteredUsers] = useState(users);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
        router.refresh();
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (term === "") {
            setFilteredUsers(users);
        } else {
            setFilteredUsers(users.filter((u: any) =>
                u.name?.toLowerCase().includes(term.toLowerCase()) ||
                u.email?.toLowerCase().includes(term.toLowerCase())
            ));
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        setIsUpdating(true);
        const res = await updateUserRole(userId, newRole);
        if (res.success) {
            toast.success("Rôle mis à jour avec succès");
            router.refresh();
        } else {
            toast.error(res.error || "Erreur lors de la mise à jour");
        }
        setIsUpdating(false);
    };

    const displayStats = [
        {
            label: "Livraisons Totales",
            value: stats?.totalDeliveries.toString() || "0",
            change: "",
            icon: Package,
            color: "from-emerald-500 to-teal-600"
        },
        {
            label: "Coursiers Actifs",
            value: stats?.activeCouriers.toString() || "0",
            change: "",
            icon: Truck,
            color: "from-blue-500 to-indigo-600"
        },
        {
            label: "Points de Livraison",
            value: stats?.deliveryPoints.toString() || "0",
            change: "",
            icon: MapPin,
            color: "from-purple-500 to-pink-600"
        },
        {
            label: "Clients",
            value: stats?.totalClients.toString() || "0",
            change: "",
            icon: Users,
            color: "from-orange-500 to-red-600"
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <Truck className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-foreground">
                                Loko<span className="text-emerald-500">.</span>
                            </span>
                            <span className="px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-500 rounded-full ml-2">
                                Admin
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-muted-foreground hidden sm:block">
                                Bienvenue, {user.name}
                            </span>
                            <Link href="/">
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                    <Home className="w-5 h-5" />
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSignOut}
                                className="text-slate-400 hover:text-red-400"
                            >
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {displayStats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-card backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm">{stat.label}</p>
                                    <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                                    <p className="text-emerald-500 text-sm mt-1 flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4" />
                                        {stat.change}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* User Management */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 bg-card backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-foreground">Gestion des Utilisateurs</h2>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" className="text-emerald-500 hover:text-emerald-600">
                                        <Search className="w-4 h-4 mr-2" />
                                        Rechercher
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-background border-border text-foreground">
                                    <DialogHeader>
                                        <DialogTitle>Rechercher un utilisateur</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Input
                                            placeholder="Nom ou email..."
                                            value={searchTerm}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className="bg-muted border-input text-foreground"
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.slice(0, 10).map((u: any, index: number) => (
                                    <motion.div
                                        key={u.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                                                {u.image ? (
                                                    <img src={u.image} alt={u.name} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    u.name?.charAt(0).toUpperCase() || "U"
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{u.name}</p>
                                                <p className="text-sm text-muted-foreground">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Select
                                                defaultValue={u.role || "client"}
                                                onValueChange={(val) => handleRoleUpdate(u.id, val)}
                                                disabled={isUpdating}
                                            >
                                                <SelectTrigger className="w-[110px] h-8 bg-background border-input text-foreground">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                                    <SelectItem value="client">Client</SelectItem>
                                                    <SelectItem value="courier">Coursier</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="seller">Vendeur</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-center text-slate-500 py-8">Aucun utilisateur trouvé</p>
                            )}
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-card backdrop-blur-xl border border-border/50 rounded-2xl p-6 h-fit shadow-sm"
                    >
                        <h2 className="text-lg font-semibold text-foreground mb-6">Actions Rapides</h2>
                        <div className="space-y-3">
                            <Link href="/deliveries/create" className="block">
                                <Button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Package className="w-5 h-5 mr-2" />
                                    Nouvelle Livraison
                                </Button>
                            </Link>
                            <Link href="/couriers" className="block">
                                <Button variant="outline" className="w-full justify-start border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                                    <Users className="w-5 h-5 mr-2" />
                                    Gérer les Coursiers
                                </Button>
                            </Link>
                            <Link href="/tracking" className="block">
                                <Button variant="outline" className="w-full justify-start border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                                    <MapPin className="w-5 h-5 mr-2" />
                                    Suivi en Temps Réel
                                </Button>
                            </Link>
                            <Link href="/users" className="block">
                                <Button variant="outline" className="w-full justify-start border-border text-foreground hover:bg-muted">
                                    <Users className="w-4 h-4 mr-2" />
                                    Gérer les Utilisateurs
                                </Button>
                            </Link>
                            <Link href="/marketplace" className="block">
                                <Button variant="outline" className="w-full justify-start border-border text-foreground hover:bg-muted">
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    Gérer le Marketplace
                                </Button>
                            </Link>
                        </div>

                        {/* Activity Summary */}
                        <div className="mt-8 pt-6 border-t border-border">
                            <h3 className="text-sm font-medium text-muted-foreground mb-4">Aujourd'hui</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm text-muted-foreground">12 livraisons complétées</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm text-muted-foreground">8 en cours de livraison</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-orange-500" />
                                    <span className="text-sm text-muted-foreground">2 en attente d'assignation</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
