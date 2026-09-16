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
      <div className="sun-glow" />
      <div className="path horizontal" />
      <div className="path vertical" />
      <div className="river"><i /><i /><i /></div>
      <div className="bridge"><i /><i /><i /><i /></div>
      <div className="crop-field field-one"><i /><i /><i /><i /><i /><i /></div>
      <div className="crop-field field-two"><i /><i /><i /><i /></div>
      <div className="forest forest-one"><i /><i /><i /><i /></div>
      <div className="forest forest-two"><i /><i /><i /></div>
      <div className="flowers flowers-one">✦ · ✿ · ✦</div>
      <div className="flowers flowers-two">✿ · ✦</div>
      <div className="fence fence-one" />
      <div className="fence fence-two" />
      {districts.map((district) => (
        <Building
          key={district.id}
          district={district}
          active={selected?.id === district.id}
          onSelect={onSelect}
        />
      ))}
      <div className="player" aria-hidden="true"><span /></div>
      <div className="map-hint">✦ CHOOSE A BUILDING TO EXPLORE ✦</div>
    </section>
  )
}
