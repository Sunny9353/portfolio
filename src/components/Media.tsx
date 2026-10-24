import { Art } from '../projects/art'
import type { ArtKind } from '../projects/art'

/** A project visual: a screenshot or a drawn figure, sized and cropped the same way everywhere. */
export default function Media({
  src, art, alt, lazy = true, fit = 'cover',
}: { src?: string; art?: ArtKind; alt: string; lazy?: boolean; fit?: 'cover' | 'contain' }) {
  if (art) return <Art kind={art} />
  return <img src={src} alt={alt} loading={lazy ? 'lazy' : undefined} decoding="async" draggable={false} style={{ objectFit: fit }} />
}
