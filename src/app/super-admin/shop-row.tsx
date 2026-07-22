'use client'

import { useState } from 'react'
import { toggleShopStatus } from './actions'
import { ToggleLeft, ToggleRight } from 'lucide-react'

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
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="px-6 py-4 font-medium">{shop.name}</td>
      <td className="px-6 py-4">
        {owner ? (
          <div>
            <p className="font-semibold text-xs">{owner.name}</p>
            <p className="text-xs text-muted-foreground">{owner.email}</p>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs italic">No Owner Linked</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          shop.subscriptionPlan === 'ENTERPRISE' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'
        }`}>
          {shop.subscriptionPlan}
        </span>
      </td>
      <td className="px-6 py-4 text-xs font-mono">
        {new Date(shop.subscriptionEnd).toLocaleDateString('en-IN')}
      </td>
      <td className="px-6 py-4 text-xs">
        <span className="text-muted-foreground">Cust:</span> <strong className="font-mono">{shop._count.customers}</strong> | 
        <span className="text-muted-foreground ml-2">Loans:</span> <strong className="font-mono">{shop._count.loans}</strong>
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`flex items-center gap-1 ml-auto text-xs font-semibold py-1 px-3 rounded-full border transition ${
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
        </button>
      </td>
    </tr>
  )
}
