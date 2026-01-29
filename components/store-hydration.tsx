"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/store"

export function StoreHydration() {
  useEffect(() => {
    // Manually hydrate the store on the client side only. When done, mark hydrated
    // so AuthProvider doesn't redirect to login before persisted auth is restored.
    useAppStore.persist.rehydrate().then(() => {
      useAppStore.getState().setHasHydrated()
    })
  }, [])

  return null
}
