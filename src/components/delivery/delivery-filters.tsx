"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useCallback } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect } from "react"

const statusFilters = [
    { label: "Toutes", value: "ALL" },
    { label: "En attente", value: "CREATED" },
    { label: "Assignées", value: "ASSIGNED" },
    { label: "En transit", value: "IN_TRANSIT" },
    { label: "Livrées", value: "DELIVERED" },
    { label: "Échouées", value: "FAILED" },
]

export function DeliveryFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentStatus = searchParams.get("status") || "ALL"
    const currentSearch = searchParams.get("search") || ""

    const [searchTerm, setSearchTerm] = useState(currentSearch)
    const debouncedSearch = useDebounce(searchTerm, 400)

    const updateFilters = useCallback((newFilters: { status?: string, search?: string }) => {
        const params = new URLSearchParams(searchParams.toString())

        if (newFilters.status) {
            if (newFilters.status === "ALL") {
                params.delete("status")
            } else {
                params.set("status", newFilters.status)
            }
        }

        if (typeof newFilters.search === "string") {
            if (newFilters.search) {
                params.set("search", newFilters.search)
            } else {
                params.delete("search")
            }
        }

        router.push(`/deliveries?${params.toString()}`)
    }, [router, searchParams])

    useEffect(() => {
        if (debouncedSearch !== currentSearch) {
            updateFilters({ search: debouncedSearch })
        }
    }, [debouncedSearch, currentSearch, updateFilters])

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par ID ou description..."
                        className="pl-9 bg-muted/50 border-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="shrink-0">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            {/* Status Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {statusFilters.map((filter) => (
                    <Button
                        key={filter.value}
                        variant={currentStatus === filter.value ? "default" : "outline"}
                        size="sm"
                        className="shrink-0 rounded-full"
                        onClick={() => updateFilters({ status: filter.value })}
                    >
                        {filter.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}
