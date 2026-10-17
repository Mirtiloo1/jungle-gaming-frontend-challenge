import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { io } from 'socket.io-client'
import { isAxiosError } from 'axios'
import type { SessionUser } from '@/features/auth/context'
import { useCart } from '@/features/cart/context'
import { http } from '@/lib/http'
import { readSessionToken } from '@/lib/session-token'
import { apiErrorMessage } from '@/lib/api-error'
import type {
  CheckoutSetup,
  CollectorProfile,
  Order,
  OrderInput,
  Provider,
  Quote,
  Wallet,
} from './types'

type Attempt = { key: string; body: OrderInput }
function readAttempt(userId: string): Attempt | null {
  try {
    const value = JSON.parse(
      localStorage.getItem(`kurio.checkout-attempt.${userId}`) ?? 'null',
    )
    return typeof value?.key === 'string' &&
      typeof value?.body?.quoteId === 'string' &&
      value.body.profile
      ? value
      : null
  } catch {
    return null
  }
}

export function useCheckoutFlow(user: SessionUser) {
  const client = useQueryClient()
  const navigate = useNavigate({ from: '/pagamento' })
  const { pedido: orderId } = useSearch({ from: '/pagamento' })
  const cart = useCart()
  const token = readSessionToken()
  const setupKey = ['checkout', user.id, 'setup']
  const [profile, setProfile] = useState<CollectorProfile | null>(null)
  const [walletId, setWalletId] = useState('')
  const [provider, setProvider] = useState<Provider>('coinbase')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [message, setMessage] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [socketVersion, setSocketVersion] = useState(0)
  const [attempt, setAttemptState] = useState<Attempt | null>(() =>
    readAttempt(user.id),
  )
  const locked = useRef(false)
  const setup = useQuery({
    queryKey: setupKey,
    queryFn: async ({ signal }) =>
      (await http.get<CheckoutSetup>('/checkout', { signal })).data,
    staleTime: 30_000,
    retry: false,
  })
  useEffect(() => {
    if (!setup.data) return
    setProfile((previous) => previous ?? setup.data.profile)
    if (!walletId) {
      const wallet =
        setup.data.wallets.find((item) => item.connected) ??
        setup.data.wallets[0]
      if (wallet) {
        setWalletId(wallet.id)
        setProvider(wallet.provider ?? 'coinbase')
      }
    }
  }, [setup.data, walletId])
  const wallet = setup.data?.wallets.find((item) => item.id === walletId)
  const connected = !!wallet?.connected && wallet.provider === provider

  function setAttempt(value: Attempt | null) {
    if (value)
      localStorage.setItem(
        `kurio.checkout-attempt.${user.id}`,
        JSON.stringify(value),
      )
    else localStorage.removeItem(`kurio.checkout-attempt.${user.id}`)
    setAttemptState(value)
  }
  function receiveOrder(order: Order) {
    if (readSessionToken() !== token) return
    client.setQueryData(['checkout', user.id, 'order', order.id], order)
    void navigate({ search: { pedido: order.id }, replace: true })
  }
  const submit = useMutation({
    mutationFn: async (value: Attempt) =>
      (
        await http.post<Order>('/orders', value.body, {
          headers: { 'Idempotency-Key': value.key },
          timeout: 3000,
        })
      ).data,
    onSuccess: receiveOrder,
    onError: (error) => {
      if (readSessionToken() !== token) return
      if (
        isAxiosError(error) &&
        [409, 422].includes(error.response?.status ?? 0)
      ) {
        if (error.response?.data.orderId) {
          void navigate({
            search: { pedido: error.response.data.orderId },
            replace: true,
          })
          return
        }
        setAttempt(null)
        setQuote(null)
        setFields(error.response?.data.fields ?? {})
        cart.refetch()
      }
      setMessage(apiErrorMessage(error))
    },
    retry: false,
  })
  const recovery = useQuery({
    queryKey: ['checkout', user.id, 'attempt', attempt?.key],
    queryFn: async ({ signal }) =>
      (
        await http.get<Order>(
          `/orders/attempt/${encodeURIComponent(attempt!.key)}`,
          { signal },
        )
      ).data,
    enabled: !!attempt && !orderId && !submit.isPending,
    retry: false,
  })
  useEffect(() => {
    if (recovery.data && !orderId) receiveOrder(recovery.data)
  }, [recovery.data, orderId]) // eslint-disable-line react-hooks/exhaustive-deps
  const order = useQuery({
    queryKey: ['checkout', user.id, 'order', orderId],
    queryFn: async ({ signal }) => {
      const incoming = (
        await http.get<Order>(`/orders/${encodeURIComponent(orderId!)}`, {
          signal,
        })
      ).data
      const previous = client.getQueryData<Order>([
        'checkout',
        user.id,
        'order',
        orderId,
      ])
      return previous &&
        (previous.version > incoming.version || previous.status !== 'pending')
        ? previous
        : incoming
    },
    enabled: !!orderId,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? 1500 : false,
    refetchOnReconnect: true,
  })
  const orderVersion = order.data?.version
  useEffect(() => {
    if (!orderVersion) return
    setSocketVersion((current) => Math.max(current, orderVersion))
  }, [orderVersion])
  useEffect(() => {
    if (!orderId || !token) return
    setSocketVersion(0)
    const socket = io(
      import.meta.env.VITE_ENABLE_MOCKS !== 'false'
        ? window.location.origin
        : (import.meta.env.VITE_SOCKET_URL ?? window.location.origin),
      { transports: ['websocket'], reconnectionDelay: 1000 },
    )
    const onConnect = () => {
      if (readSessionToken() !== token) return
      socket.emit('order.subscribe', { token, orderId })
      void client.invalidateQueries({
        queryKey: ['checkout', user.id, 'order', orderId],
      })
    }
    const onUpdate = (event: {
      userId: string
      id: string
      version: number
      order: Order
    }) => {
      if (
        readSessionToken() !== token ||
        event.userId !== user.id ||
        event.id !== orderId ||
        event.order.id !== orderId
      )
        return
      const key = ['checkout', user.id, 'order', orderId]
      const previous = client.getQueryData<Order>(key)
      setSocketVersion((current) => Math.max(current, event.version))
      if (
        previous &&
        (event.version <= previous.version || previous.status !== 'pending')
      )
        return
      client.setQueryData(key, event.order)
    }
    socket.on('connect', onConnect)
    socket.on('order.updated', onUpdate)
    return () => {
      socket.off('connect', onConnect)
      socket.off('order.updated', onUpdate)
      socket.disconnect()
    }
  }, [orderId, token, user.id, client])
  useEffect(() => {
    if (!order.data || order.data.status === 'pending') return
    localStorage.removeItem(`kurio.checkout-attempt.${user.id}`)
    void client.invalidateQueries({ queryKey: ['cart'] })
  }, [order.data?.status, user.id, client]) // eslint-disable-line react-hooks/exhaustive-deps

  const connection = useMutation({
    mutationFn: async (connect: boolean) =>
      (
        await http.post<{ wallets: Wallet[] }>(
          `/wallets/${encodeURIComponent(walletId)}/connection`,
          { provider, connect },
        )
      ).data,
    onSuccess: (data) => {
      if (readSessionToken() !== token) return
      client.setQueryData<CheckoutSetup>(setupKey, (previous) =>
        previous ? { ...previous, wallets: data.wallets } : previous,
      )
      setQuote(null)
      setMessage('')
    },
    onError: (error) => setMessage(apiErrorMessage(error)),
    retry: false,
  })
  const preparation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Perfil indisponível.')
      await http.put('/checkout/profile', profile)
      return (await http.post<Quote>('/checkout/quote', { walletId, provider }))
        .data
    },
    onSuccess: (result) => {
      if (readSessionToken() === token) {
        setQuote(result)
        setMessage('')
        setFields({})
      }
    },
    onError: (error) => {
      setMessage(apiErrorMessage(error))
      if (isAxiosError(error)) setFields(error.response?.data.fields ?? {})
    },
    retry: false,
  })
  async function placeOrder() {
    if (!quote || !profile || locked.current || attempt) return
    locked.current = true
    try {
      setMessage('')
      const value = {
        key: crypto.randomUUID(),
        body: { quoteId: quote.id, profile: structuredClone(profile) },
      }
      setAttempt(value)
      await submit.mutateAsync(value)
    } catch {
      /* Mutation mantém o contexto e a mensagem para recuperação. */
    } finally {
      locked.current = false
    }
  }
  function resetOrder() {
    setAttempt(null)
    setSocketVersion(0)
    setQuote(null)
    setMessage('')
    submit.reset()
    void navigate({ search: {}, replace: true })
    cart.refetch()
  }
  return {
    cart,
    setup,
    profile,
    setProfile,
    walletId,
    wallet,
    provider,
    setProvider: (value: Provider) => {
      setProvider(value)
      setQuote(null)
    },
    selectWallet: (id: string) => {
      setWalletId(id)
      setQuote(null)
      setMessage('')
    },
    connected,
    connection,
    quote,
    setQuote,
    message,
    setMessage,
    fields,
    preparation,
    placeOrder,
    submit,
    order,
    orderId,
    socketVersion,
    attempt,
    recovery,
    resetOrder,
    retryAttempt: () => {
      if (attempt && !submit.isPending) submit.mutate(attempt)
    },
    addWallet: (value: Wallet) => {
      client.setQueryData<CheckoutSetup>(setupKey, (previous) =>
        previous
          ? { ...previous, wallets: [...previous.wallets, value] }
          : previous,
      )
      setWalletId(value.id)
      setQuote(null)
    },
  }
}
