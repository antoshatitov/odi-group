export const formatPrice = (value: number) => {
  return `от ${value.toFixed(1).replace('.', ',')} млн ₽`
}

export const formatArea = (value: number) => `${value} м²`

export const formatRubles = (value: number) => {
  const formatted = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)
  return `${formatted.replace(/\u00A0/g, ' ')} ₽`
}
