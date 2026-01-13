import { getAllProducts } from "@/app/actions/product"
import { ShopClient } from "@/components/shop/shop-client"
import { getSession } from "@/lib/auth-server"
import { getSavedAddresses } from "@/app/actions/saved-addresses"

export const dynamic = 'force-dynamic'

export default async function ShopPage() {
    const [result, session, addressesResult] = await Promise.all([
        getAllProducts(),
        getSession(),
        getSavedAddresses()
    ])

    const products = result.success ? result.products : []
    const savedAddresses = (addressesResult as any).success ? (addressesResult as any).addresses : []

    return <ShopClient products={products || []} user={session?.user} savedAddresses={savedAddresses} />
}
