import type { District } from '../types'

type Props = {
  district: District
  active: boolean
  nearby: boolean
  onSelect: (district: District) => void
}

export function Building({ district, active, nearby, onSelect }: Props) {
  const variant = district.label.length % 4

  return (
    <button
      className={`building level-${district.level} variant-${variant}${active ? ' active' : ''}${nearby ? ' nearby' : ''}`}
      style={{ left: `${district.x}%`, top: `${district.y}%`, '--accent': district.color } as React.CSSProperties}
      onClick={() => onSelect(district)}
      aria-label={`Explore ${district.label}, ${district.fileCount} files`}
    >
      <span className="building-chimney" />
      <span className="building-roof" />
      <span className="building-body">
        <span className="window-grid"><i /><i /><i /><i /></span>
        <span className="building-door" />
        <span className="building-vine" />
      </span>
      <span className="building-sign">{district.label}</span>
      <span className="building-count">{district.fileCount}</span>
    </button>
  )
}
