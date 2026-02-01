export type ImageAsset = {
  src: string
  alt: string
}

export type Project = {
  id: string
  name: string
  area: number
  floors: number
  bedrooms: number
  rooms: number
  material: string
  priceFrom: number
  duration: string
  highlight: string
  description: string
  equipment: string[]
  features: string[]
  image: ImageAsset
  gallery: ImageAsset[]
  plans: ImageAsset[]
}

export type GalleryItem = {
  id: string
  title: string
  location: string
  description: string
  cover: ImageAsset
  photos: ImageAsset[]
}
