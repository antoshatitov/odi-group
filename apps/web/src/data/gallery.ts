import type { GalleryItem } from '../types'

type RawImage = {
  path: string
  src: string
}

const descriptionModules = import.meta.glob('../assets/builded/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const imageModules = import.meta.glob(
  '../assets/builded/**/*.{jpg,jpeg,JPG,JPEG,png,webp}',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, string>

const normalizePath = (path: string) => path.replace(/\\/g, '/').normalize('NFC')

const getFolderName = (path: string) =>
  normalizePath(path).split('/').slice(-2, -1)[0] ?? ''

const isDescriptionFile = (path: string) =>
  normalizePath(path).endsWith('/Описание.md')

const parseDescription = (raw: string) => {
  const lines = raw
    .split('\n')
    .map((line) => line.replace(/\r/g, '').trim())
    .filter(Boolean)
  const [title = '', locationLine = '', ...rest] = lines
  const location = locationLine.replace(/^Локация:\s*/i, '').trim()
  const description = rest.join(' ')
  return { title, location, description }
}

const sortImages = (images: RawImage[]) =>
  images.slice().sort((a, b) => {
    const aIsTitle = /title_photo/i.test(a.path)
    const bIsTitle = /title_photo/i.test(b.path)
    if (aIsTitle !== bIsTitle) return aIsTitle ? -1 : 1

    const aIsPlan = /plan/i.test(a.path)
    const bIsPlan = /plan/i.test(b.path)
    if (aIsPlan !== bIsPlan) return aIsPlan ? 1 : -1

    return a.path.localeCompare(b.path)
  })

const formatAlt = (title: string, path: string, index: number) => {
  if (/plan/i.test(path)) return `${title} — планировка`
  return `${title} — фото ${index + 1}`
}

const imagesByFolder = Object.entries(imageModules).reduce<Record<string, RawImage[]>>(
  (acc, [path, src]) => {
    const folder = getFolderName(path)
    if (!folder) return acc
    const list = acc[folder] ?? []
    list.push({ path, src })
    acc[folder] = list
    return acc
  },
  {},
)

export const galleryItems: GalleryItem[] = Object.entries(descriptionModules)
  .filter(([path]) => isDescriptionFile(path))
  .map(([path, raw], index) => {
    const folder = getFolderName(path)
    const { title, location, description } = parseDescription(raw)
    const safeTitle = title || folder || `Проект ${index + 1}`
    const images = sortImages(imagesByFolder[folder] ?? [])
    const coverImage =
      images.find((image) => /title_photo/i.test(image.path)) ?? images[0]
    const photos = images.map((image, photoIndex) => ({
      src: image.src,
      alt: formatAlt(safeTitle, image.path, photoIndex),
    }))

    return {
      id: folder || `builded-${index + 1}`,
      title: safeTitle,
      location,
      description,
      cover: {
        src: coverImage?.src ?? '',
        alt: `${safeTitle} — главное фото`,
      },
      photos,
    }
  })
  .sort((a, b) => a.title.localeCompare(b.title, 'ru'))
