"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/store"

export function StoreHydration() {
  useEffect(() => {
    // Manually hydrate the store on the client side only
    useAppStore.persist.rehydrate()
  }, [])

  return null
}
