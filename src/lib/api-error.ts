import { isAxiosError } from 'axios'

export function apiErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error))
    return error.response?.data.message ?? 'Falha de conexão. Tente novamente.'
  return 'Não foi possível concluir a operação. Tente novamente.'
}
