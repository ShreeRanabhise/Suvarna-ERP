'use client'

import { useState } from 'react'
import { toggleShopStatus } from './actions'
import { ToggleLeft, ToggleRight } from 'lucide-react'
import { LoadingButton } from '@/components/loading-button'

type ShopWithDetails = {
  id: string
  name: string
  subscriptionPlan: string
  subscriptionEnd: Date | string
  users: { name: string | null; email: string }[]
  _count: { customers: number; loans: number }
}

export default function ShopRow({ shop }: { shop: ShopWithDetails }) {
  const isExpired = new Date(shop.subscriptionEnd) < new Date()
  const [suspended, setSuspended] = useState(isExpired)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      const nextSuspended = !suspended
      const res = await toggleShopStatus(shop.id, nextSuspended)
      if (res.success) {
        setSuspended(nextSuspended)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const owner = shop.users[0]

  return (
    <tr className="border-b border-border last:border-0 hover:bg-background-secondary transition-colors">
      <td className="px-5 py-4 font-medium text-foreground">{shop.name}</td>
      <td className="px-5 py-4">
        {owner ? (
          <div>
            <p className="font-semibold text-sm text-foreground">{owner.name}</p>
            <p className="text-xs text-foreground-secondary">{owner.email}</p>
          </div>
        ) : (
          <span className="text-foreground-muted text-xs italic">No Owner Linked</span>
        )}
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
          shop.subscriptionPlan === 'ENTERPRISE' ? 'bg-primary-light text-primary' : 'bg-background-secondary text-foreground-secondary border border-border'
        }`}>
          {shop.subscriptionPlan}
        </span>
      </td>
      <td className="px-5 py-4 text-sm text-foreground-secondary font-mono">
        {new Date(shop.subscriptionEnd).toLocaleDateString('en-IN')}
      </td>
      <td className="px-5 py-4 text-sm">
        <span className="text-foreground-muted text-xs">Cust:</span> <strong className="font-mono text-foreground">{shop._count.customers}</strong> | 
        <span className="text-foreground-muted ml-2 text-xs">Loans:</span> <strong className="font-mono text-foreground">{shop._count.loans}</strong>
      </td>
      <td className="px-5 py-4 text-right">
        <LoadingButton
          onClick={handleToggle}
          loading={loading}
          className={`flex items-center gap-1.5 ml-auto text-xs font-medium py-1.5 px-3 rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            suspended
              ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
              : 'bg-success/10 text-success border-success/20 hover:bg-success/20'
          }`}
        >
          {suspended ? (
            <>
              <ToggleLeft className="h-4 w-4" />
              <span>Suspended</span>
            </>
          ) : (
            <>
              <ToggleRight className="h-4 w-4" />
              <span>Active</span>
            </>
          )}
        </LoadingButton>
      </td>
    </tr>
  )
}
