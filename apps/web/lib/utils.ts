import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 小数時間 → 時間・分に変換 (例: 2.5 → { hours: 2, minutes: 30 }) */
export function hoursToHm(decimalHours: number): { hours: number; minutes: number } {
  const hours = Math.floor(decimalHours)
  const minutes = Math.round((decimalHours - hours) * 60)
  return { hours, minutes }
}

/** 時間・分 → 小数時間に変換 (例: 2, 30 → 2.5) */
export function hmToHours(hours: number, minutes: number): number {
  return hours + minutes / 60
}

/** 小数時間を "Xh Ym" 形式で表示 (例: 2.5 → "2h 30m") */
export function formatDuration(decimalHours: number): string {
  const { hours, minutes } = hoursToHm(decimalHours)
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

/** 日付を YYYY/MM/DD 形式で返す（JST固定） */
export function formatDateJst(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/** 曜日を日本語で返す（短縮形） */
export function getDayOfWeek(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00+09:00') : date
  return d.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', weekday: 'short' })
}

/** 今日の日付を YYYY-MM-DD 形式で返す（JST固定） */
export function todayJst(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
}

/** パーセント表示（小数点1桁） */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0.0%'
  return ((value / total) * 100).toFixed(1) + '%'
}
