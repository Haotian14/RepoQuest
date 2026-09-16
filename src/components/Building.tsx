import type { District } from '../types'
import { buildingSprites } from '../art'

type Props = {
  district: District
  active: boolean
  nearby: boolean
  onSelect: (district: District) => void
}

export function Building({ district, active, nearby, onSelect }: Props) {
  const variant = district.label.length % 4
  const tiles = buildingSprites[variant % buildingSprites.length]

  return (
    <button
      className={`building level-${district.level} variant-${variant}${active ? ' active' : ''}${nearby ? ' nearby' : ''}`}
      style={{ left: `${district.x}%`, top: `${district.y}%`, '--accent': district.color } as React.CSSProperties}
      onClick={() => onSelect(district)}
      aria-label={`Explore ${district.label}, ${district.fileCount} files`}
    >
      <span className="building-sprite" aria-hidden="true">
        {tiles.map((tile, index) => <img key={`${tile}-${index}`} src={tile} alt="" />)}
        <span className="building-emblem">{district.path === 'root' ? '★' : '◆'}</span>
      </span>
      <span className="building-sign">{district.label}</span>
      <span className="building-count">{district.fileCount}</span>
    </button>
  )
}
