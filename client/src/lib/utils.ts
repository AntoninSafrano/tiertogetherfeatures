import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
