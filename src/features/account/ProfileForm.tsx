import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import { http } from '@/lib/http'
import { apiErrorMessage } from '@/lib/api-error'
import { readSessionToken } from '@/lib/session-token'
import { fieldClass } from '@/features/checkout/ProfileFields'
import type { ProfileInput, ProfileResponse, AccountProfile } from './types'
import Avatar from './Avatar'
import { avatarFromFile } from './avatar-file'

export default function ProfileForm({
  initial,
  userId,
}: {
  initial: AccountProfile
  userId: string
}) {
  const [draft, setDraft] = useState<ProfileInput>({
    ...initial,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [fields, setFields] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const client = useQueryClient()
  const token = readSessionToken()
  const mutation = useMutation({
    mutationFn: async () =>
      (await http.put<ProfileResponse>('/profile', draft)).data,
    onSuccess: (result) => {
      if (readSessionToken() !== token) return
      setDraft({
        ...result.profile,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setFields({})
      setMessage('Perfil salvo com sucesso.')
      client.setQueryData(['session'], { user: result.user })
      client.setQueryData(['checkout', userId, 'profile'], result)
      void client.invalidateQueries({ queryKey: ['checkout', userId] })
    },
    onError: (error) => {
      const next = isAxiosError(error)
        ? (error.response?.data.fields ?? {})
        : {}
      setFields(next)
      setMessage('')
    },
    retry: false,
  })
  useEffect(() => {
    if (!mutation.isPending && Object.keys(fields).length)
      document.getElementById(`profile-${Object.keys(fields)[0]}`)?.focus()
  }, [fields, mutation.isPending])
  const input = (
    key: 'displayName' | 'username' | 'email' | 'walletNickname',
    label: string,
    max: number,
  ) => (
    <label className="block text-sm" htmlFor={`profile-${key}`}>
      {label}
      <span className="text-highlight"> *</span>
      <input
        id={`profile-${key}`}
        aria-label={label}
        value={draft[key]}
        required
        type={key === 'email' ? 'email' : 'text'}
        maxLength={max}
        autoComplete={
          key === 'email' ? 'email' : key === 'username' ? 'username' : 'off'
        }
        onChange={(event) => {
          setDraft({ ...draft, [key]: event.target.value })
          setMessage('')
        }}
        aria-invalid={!!fields[key]}
        aria-describedby={fields[key] ? `profile-${key}-error` : undefined}
        className={`${fieldClass} mt-3`}
      />
      {fields[key] && (
        <span
          id={`profile-${key}-error`}
          className="mt-1 block text-xs text-highlight"
        >
          {fields[key]}
        </span>
      )}
    </label>
  )
  return (
    <form
      id="profile-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate()
      }}
    >
      <fieldset
        disabled={mutation.isPending || imageLoading}
        className="min-w-0"
      >
        <section className="rounded-2xl bg-card/50 p-4 lg:bg-transparent lg:p-0">
          <h1 className="mb-7 text-lg font-bold">Perfil do colecionador</h1>
          <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
            {input('displayName', 'Nome de exibição', 60)}
            {input('username', 'Nome de usuário', 24)}
            {input('email', 'E-mail', 254)}
            <label htmlFor="profile-ens" className="text-sm">
              Nome ENS (opcional)
              <div className="mt-3 flex gap-2">
                <span className="flex h-11 items-center rounded-sm border border-border px-3 text-muted-foreground">
                  .eth
                </span>
                <input
                  id="profile-ens"
                  aria-label="Nome ENS (opcional)"
                  value={draft.ens.replace(/\.eth$/i, '')}
                  maxLength={96}
                  placeholder="seunome"
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      ens: event.target.value
                        ? `${event.target.value.replace(/\.eth$/i, '')}.eth`
                        : '',
                    })
                  }
                  className={fieldClass}
                  aria-invalid={!!fields.ens}
                  aria-describedby={
                    fields.ens ? 'profile-ens-error' : undefined
                  }
                />
              </div>
              {fields.ens && (
                <span
                  id="profile-ens-error"
                  className="mt-1 block text-xs text-highlight"
                >
                  {fields.ens}
                </span>
              )}
            </label>
            {input('walletNickname', 'Apelido da carteira', 40)}
            <div>
              <p className="text-sm">Avatar</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <Avatar
                  src={draft.avatar}
                  name={draft.displayName}
                  className="size-12"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  aria-label="Arquivo de avatar"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    if (!file) return
                    setImageLoading(true)
                    setAvatarError('')
                    try {
                      const avatar = await avatarFromFile(file)
                      setDraft((previous) => ({ ...previous, avatar }))
                      setMessage('')
                    } catch (error) {
                      setAvatarError(
                        error instanceof Error
                          ? error.message
                          : 'Não foi possível abrir a imagem.',
                      )
                    } finally {
                      setImageLoading(false)
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="min-h-11 rounded-sm bg-primary px-5 text-sm font-bold text-primary-foreground"
                >
                  Alterar
                </button>
                <button
                  type="button"
                  disabled={!draft.avatar}
                  onClick={() => {
                    setDraft({ ...draft, avatar: null })
                    setMessage('')
                  }}
                  className="min-h-11 text-xs hover:text-primary disabled:opacity-40"
                >
                  Remover
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                PNG, JPG ou WebP. Aplicado ao salvar.
              </p>
              {(avatarError || fields.avatar) && (
                <p role="alert" className="mt-2 text-xs text-highlight">
                  {avatarError || fields.avatar}
                </p>
              )}
            </div>
          </div>
        </section>
        <section className="mt-6 rounded-2xl bg-card/50 p-4 lg:bg-transparent lg:p-0">
          <h2 className="mb-4 text-base font-bold">Alterar senha</h2>
          <p className="mb-5 text-xs text-muted-foreground">
            Preencha somente se quiser trocar sua senha.
          </p>
          <div className="space-y-5 md:max-w-[calc(50%_-_.875rem)]">
            {(
              [
                ['currentPassword', 'Senha atual'],
                ['newPassword', 'Nova senha'],
                ['confirmPassword', 'Confirmar nova senha'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                htmlFor={`profile-${key}`}
                className="block text-sm"
              >
                {label}
                <div className="relative mt-3">
                  <input
                    id={`profile-${key}`}
                    aria-label={label}
                    autoComplete={
                      key === 'currentPassword'
                        ? 'current-password'
                        : 'new-password'
                    }
                    type={visible[key] ? 'text' : 'password'}
                    maxLength={128}
                    value={draft[key]}
                    onChange={(event) => {
                      setDraft({ ...draft, [key]: event.target.value })
                      setMessage('')
                    }}
                    className={`${fieldClass} pr-12`}
                    aria-invalid={!!fields[key]}
                    aria-describedby={
                      fields[key] ? `profile-${key}-error` : undefined
                    }
                  />
                  <button
                    type="button"
                    aria-label={`${visible[key] ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
                    aria-pressed={!!visible[key]}
                    onClick={() =>
                      setVisible({ ...visible, [key]: !visible[key] })
                    }
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
                  >
                    {visible[key] ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {fields[key] && (
                  <span
                    id={`profile-${key}-error`}
                    className="mt-1 block text-xs text-highlight"
                  >
                    {fields[key]}
                  </span>
                )}
              </label>
            ))}
          </div>
        </section>
      </fieldset>
      {mutation.isError && (
        <p role="alert" className="mt-4 text-sm text-highlight">
          {apiErrorMessage(mutation.error)}
        </p>
      )}
      <p role="status" className="mt-4 text-sm text-primary">
        {message}
      </p>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <button
          type="submit"
          disabled={mutation.isPending || imageLoading}
          className="min-h-12 w-full rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground disabled:opacity-50 lg:min-h-10 lg:w-auto lg:min-w-32 lg:rounded-sm"
        >
          {imageLoading
            ? 'Preparando imagem…'
            : mutation.isPending
              ? 'Salvando…'
              : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
