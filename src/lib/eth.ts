export function unitsToEth(units: bigint) {
  const whole = units / 10n ** 18n
  const fraction = String(units % 10n ** 18n)
    .padStart(18, '0')
    .replace(/0+$/, '')
    .padEnd(2, '0')
  return `${whole}.${fraction}`
}
