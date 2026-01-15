
"use client"

import { useEffect } from "react";
import { DeliveryCard } from "@/components/delivery/delivery-card";
import { saveToOfflineStorage, OFFLINE_CACHE_KEYS } from "@/lib/offline-storage";

interface DeliveriesListProps {
    deliveries: any[];
}

export function DeliveriesList({ deliveries }: DeliveriesListProps) {
    useEffect(() => {
        if (deliveries && deliveries.length > 0) {
            saveToOfflineStorage(OFFLINE_CACHE_KEYS.DELIVERIES, deliveries);
        }
    }, [deliveries]);

    return (
        <div className="space-y-3">
            {deliveries.map((delivery) => (
                <DeliveryCard
                    key={delivery.id}
                    id={delivery.id}
                    status={delivery.status as any}
                    description={delivery.deliveryPoint?.description}
                    courierName={delivery.courier?.name}
                    createdAt={delivery.createdAt}
                />
            ))}
        </div>
    );
}
