export const formatPrice = (value: number) => {
  return `от ${value.toFixed(1).replace('.', ',')} млн ₽`
}

export const formatArea = (value: number) => `${value} м²`
