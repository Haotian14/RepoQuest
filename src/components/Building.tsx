import type { District } from '../types'
import { buildingArchetype } from '../art'
import { depthForY } from '../lib/depth'

type Props = {
  district: District
  active: boolean
  nearby: boolean
  occluded: boolean
  recentChangeCount?: number
  decorative?: boolean
  onSelect?: (district: District) => void
}

export function Building({
  district,
  active,
  nearby,
  occluded,
  recentChangeCount = 0,
  decorative = false,
  onSelect,
}: Props) {
  const artwork = buildingArchetype(district.path, district.label)
  const hasRecentChanges = recentChangeCount > 0

  return (
    <button
      className={`building level-${district.level} ${artwork.className}${active ? ' active' : ''}${nearby ? ' nearby' : ''}${occluded ? ' occluded' : ''}${hasRecentChanges ? ' recent-change' : ''}`}
      style={{ left: `${district.x}%`, top: `${district.y}%`, zIndex: depthForY(district.y) } as React.CSSProperties}
      type="button"
      disabled={decorative}
      onClick={() => onSelect?.(district)}
      aria-hidden={decorative || undefined}
      aria-label={`${district.canEnter ? 'Enter' : 'Explore'} ${district.label}, ${district.fileCount} files${hasRecentChanges ? `, ${recentChangeCount} recent ${recentChangeCount === 1 ? 'change' : 'changes'}` : ''}`}
    >
      <span className="building-art" aria-hidden="true">
        {artwork.accessory && <img className="building-accessory" src={artwork.accessory} alt="" />}
        {artwork.secondary && <img className="building-secondary" src={artwork.secondary} alt="" />}
        <img className="building-main" src={artwork.main} alt="" />
        <span className="building-marker">{artwork.marker}</span>
      </span>
      {hasRecentChanges && <span className="building-change-badge" aria-hidden="true">CHANGED ×{recentChangeCount}</span>}
      <span className="building-sign"><b>{district.label}</b><small>{district.canEnter ? 'ENTER · ' : ''}{district.fileCount} files</small></span>
    </button>
  )
}
