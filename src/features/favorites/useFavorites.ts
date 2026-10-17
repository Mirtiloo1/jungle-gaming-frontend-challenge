import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/context'
import { http } from '@/lib/http'
import { readSessionToken } from '@/lib/session-token'

type FavoritesResponse = { ids: string[] }

export function useFavorites() {
  const { user } = useAuth()
  const client = useQueryClient()
  const key = ['favorites', user?.id]
  const token = readSessionToken()
  const query = useQuery({
    queryKey: key,
    queryFn: async ({ signal }) =>
      (await http.get<FavoritesResponse>('/favorites', { signal })).data,
    enabled: Boolean(user),
    staleTime: 30_000,
    retry: false,
  })
  const mutation = useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      if (!user || readSessionToken() !== token)
        throw new Error('Sessão alterada.')
      return (
        await http.put<FavoritesResponse>(
          `/favorites/${encodeURIComponent(id)}`,
          { favorite },
        )
      ).data
    },
    onMutate: async ({ id, favorite }) => {
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<FavoritesResponse>(key)
      const ids = new Set(previous?.ids ?? [])
      if (favorite) ids.add(id)
      else ids.delete(id)
      client.setQueryData(key, { ids: [...ids] })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (token === readSessionToken())
        client.setQueryData(key, context?.previous ?? { ids: [] })
    },
    onSuccess: (data) => {
      if (token === readSessionToken()) client.setQueryData(key, data)
    },
    onSettled: () => {
      if (token !== readSessionToken()) client.removeQueries({ queryKey: key })
      else {
        void client.invalidateQueries({ queryKey: key })
        void client.invalidateQueries({
          queryKey: ['catalog', 'private', user?.id],
        })
      }
    },
    retry: false,
  })
  return { query, mutation, ids: new Set(query.data?.ids ?? []) }
}
