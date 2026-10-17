import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import type { CatalogResponse } from '@/features/catalog/types'
import type { NftDetail } from './types'

type MarketEvent = {
  id: string
  version: number
  price: string
  available: number
}

export default function NftRealtimeProvider({
  children,
}: {
  children: ReactNode
}) {
  const client = useQueryClient()
  const versions = useRef(new Map<string, number>())
  useEffect(() => {
    const socket =
      import.meta.env.VITE_ENABLE_MOCKS === 'false'
        ? io(window.location.origin, {
            transports: ['websocket'],
            forceNew: true,
          })
        : null
    const receive = (event: MarketEvent) => {
      if (event.version <= (versions.current.get(event.id) ?? 0)) return
      versions.current.set(event.id, event.version)
      client.setQueryData<NftDetail>(['nft', event.id], (nft) =>
        nft
          ? {
              ...nft,
              price: event.price,
              editions: nft.editions.map((edition) =>
                edition.id === 'limited-50'
                  ? {
                      ...edition,
                      price: event.price,
                      available: event.available,
                    }
                  : edition,
              ),
            }
          : nft,
      )
      client.setQueriesData<CatalogResponse>(
        { queryKey: ['catalog'] },
        (catalog) =>
          catalog
            ? {
                ...catalog,
                items: catalog.items.map((nft) =>
                  nft.id === event.id ? { ...nft, price: event.price } : nft,
                ),
              }
            : catalog,
      )
      void client.invalidateQueries({
        queryKey: ['cart'],
        refetchType: 'active',
      })
    }
    socket?.on('connect', () => socket.emit('nft.subscribe'))
    socket?.on('nft.updated', receive)
    const poll = async () => {
      try {
        const response = await fetch('/api/nft-events')
        if (response.status === 204 || !response.ok) return
        receive((await response.json()) as MarketEvent)
      } catch {
        return
      }
    }
    void poll()
    const polling = window.setInterval(() => void poll(), 2_000)
    return () => {
      window.clearInterval(polling)
      socket?.disconnect()
    }
  }, [client])
  return children
}
