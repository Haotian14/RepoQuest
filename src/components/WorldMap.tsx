import type { District } from '../types'
import { Building } from './Building'

type Props = {
  districts: District[]
  selected?: District
  onSelect: (district: District) => void
}

export function WorldMap({ districts, selected, onSelect }: Props) {
  return (
    <section className="world" aria-label="Repository world map">
      <div className="cloud cloud-one" />
      <div className="cloud cloud-two" />
      <div className="path horizontal" />
      <div className="path vertical" />
      <div className="pond"><span>≈</span><span>≈</span></div>
      <div className="forest forest-one">♠ ♠ ♠</div>
      <div className="forest forest-two">♠ ♠</div>
      {districts.map((district) => (
        <Building
          key={district.id}
          district={district}
          active={selected?.id === district.id}
          onSelect={onSelect}
        />
      ))}
      <div className="player" aria-hidden="true"><span /></div>
      <div className="map-hint">SELECT A BUILDING TO EXPLORE</div>
    </section>
  )
}
