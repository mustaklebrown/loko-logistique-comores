"use client"

import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { NotificationBell } from "./notification-bell"

interface HeaderProps {
    title?: string
}

export function Header({ title = "Loko" }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                        <Image
                            src="/loko.png"
                            alt="Loko Logo"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                    <span className="text-lg font-semibold tracking-tight">{title}</span>
                </Link>

                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <LayoutDashboard className="h-5 w-5" />
                        </Button>
                    </Link>
                    <NotificationBell />
                </div>
            </div>
        </header>
    )
}
