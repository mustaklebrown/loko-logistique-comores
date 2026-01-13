"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, MapPin, User, Plus, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/", icon: Home, label: "Accueil" },
    { href: "/deliveries", icon: Package, label: "Livraisons" },
    { href: "/shop", icon: ShoppingBag, label: "Acheter", primary: true },
    { href: "/tracking", icon: MapPin, label: "Suivi" },
    { href: "/profile", icon: User, label: "Profil" },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    if (item.primary) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex -mt-6 h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
                            >
                                <Icon className="h-6 w-6" />
                            </Link>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
