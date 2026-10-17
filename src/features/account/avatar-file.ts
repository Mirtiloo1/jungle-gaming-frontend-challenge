export async function avatarFromFile(file: File) {
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  )
    throw new Error('Escolha uma imagem PNG, JPG ou WebP de até 5 MB.')
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('Não foi possível preparar a imagem.')
  }
  const edge = Math.min(bitmap.width, bitmap.height)
  context.drawImage(
    bitmap,
    (bitmap.width - edge) / 2,
    (bitmap.height - edge) / 2,
    edge,
    edge,
    0,
    0,
    256,
    256,
  )
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.85)
}
