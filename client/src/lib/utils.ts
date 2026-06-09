import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { slugifyTitle } from '@tiertogether/shared'

/** SEO path for a tier list: /tierlist/<slug>-<id> */
export function tierlistSlugId(id: string, title: string): string {
  return `${slugifyTitle(title)}-${id}`
}

/** Category value (Gaming, Food…) ↔ SEO slug (jeux-video, cuisine…) */
export const CATEGORY_SLUGS: Record<string, string> = {
  'jeux-video': 'Gaming',
  'cuisine': 'Food',
  'anime': 'Anime',
  'musique': 'Music',
  'films': 'Movies',
  'sport': 'Sports',
  'autre': 'Other',
}

export function getCategorySlug(value: string): string | null {
  for (const [slug, v] of Object.entries(CATEGORY_SLUGS)) {
    if (v === value) return slug
  }
  return null
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const placeholderColors = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

export function getPlaceholderColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return placeholderColors[Math.abs(hash) % placeholderColors.length]!
}

const categoryBadgeColors: Record<string, string> = {
  Gaming: 'bg-blue-500/20 text-blue-400',
  Food: 'bg-orange-500/20 text-orange-400',
  Anime: 'bg-pink-500/20 text-pink-400',
  Music: 'bg-green-500/20 text-green-400',
  Movies: 'bg-yellow-500/20 text-yellow-400',
  Sports: 'bg-red-500/20 text-red-400',
  Other: 'bg-foreground-subtle/20 text-foreground-muted',
}

export function getCategoryBadgeColor(cat: string): string {
  return categoryBadgeColors[cat] ?? categoryBadgeColors.Other!
}

const categorySolidColors: Record<string, string> = {
  Gaming: 'bg-blue-500',
  Food: 'bg-orange-500',
  Anime: 'bg-pink-500',
  Music: 'bg-green-500',
  Movies: 'bg-yellow-500',
  Sports: 'bg-red-500',
  Other: 'bg-gray-500',
}

export function getCategorySolidColor(cat: string): string {
  return categorySolidColors[cat] ?? categorySolidColors.Other!
}

const categoryLabels: Record<string, string> = {
  Gaming: 'Jeux vidéo',
  Food: 'Cuisine',
  Anime: 'Anime',
  Music: 'Musique',
  Movies: 'Films',
  Sports: 'Sport',
  Other: 'Autre',
}

export function getCategoryLabel(cat: string): string {
  return categoryLabels[cat] ?? cat
}

export function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days}j`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `il y a ${weeks}sem`
  return new Date(dateStr).toLocaleDateString()
}
