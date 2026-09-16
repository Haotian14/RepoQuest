import type { District } from '../types'

export type Direction = 'up' | 'down' | 'left' | 'right'
export type PlayerPosition = { x: number; y: number }

const BOUNDS = { minX: 5, maxX: 94, minY: 7, maxY: 91 }

export function movePlayer(position: PlayerPosition, direction: Direction, step = 2.4): PlayerPosition {
  const delta = {
    up: { x: 0, y: -step },
    down: { x: 0, y: step },
    left: { x: -step, y: 0 },
    right: { x: step, y: 0 },
  }[direction]

  return {
    x: Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, position.x + delta.x)),
    y: Math.min(BOUNDS.maxY, Math.max(BOUNDS.minY, position.y + delta.y)),
  }
}

export function nearestDistrict(position: PlayerPosition, districts: District[], range = 12) {
  let nearest: District | undefined
  let nearestDistance = Number.POSITIVE_INFINITY

  districts.forEach((district) => {
    const distance = Math.hypot(position.x - district.x, position.y - district.y)
    if (distance < nearestDistance) {
      nearest = district
      nearestDistance = distance
    }
  })

  return nearestDistance <= range ? nearest : undefined
}
