import type { District } from '../types'
import { buildingArchetype } from '../art'
import { depthForY } from '../lib/depth'

type Props = {
  district: District
  active: boolean
  nearby: boolean
  onSelect: (district: District) => void
}

export function Building({ district, active, nearby, onSelect }: Props) {
  const artwork = buildingArchetype(district.path, district.label)

  return (
    <button
      className={`building level-${district.level} ${artwork.className}${active ? ' active' : ''}${nearby ? ' nearby' : ''}`}
      style={{ left: `${district.x}%`, top: `${district.y}%`, zIndex: depthForY(district.y) } as React.CSSProperties}
      onClick={(event) => {
        onSelect(district)
        if (event.detail > 0) event.currentTarget.blur()
      }}
      aria-label={`Explore ${district.label}, ${district.fileCount} files`}
    >
      <span className="building-art" aria-hidden="true">
        {artwork.accessory && <img className="building-accessory" src={artwork.accessory} alt="" />}
        {artwork.secondary && <img className="building-secondary" src={artwork.secondary} alt="" />}
        <img className="building-main" src={artwork.main} alt="" />
        <span className="building-marker">{artwork.marker}</span>
      </span>
      <span className="building-sign"><b>{district.label}</b><small>{district.fileCount} files</small></span>
    </button>
  )
}
