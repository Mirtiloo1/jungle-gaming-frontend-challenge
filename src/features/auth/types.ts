export type AuthMode = 'login' | 'register'
export type AuthFormValues = {
  username: string
  email: string
  password: string
  confirmPassword: string
}
export type AuthFieldErrors = Partial<Record<keyof AuthFormValues, string>>
