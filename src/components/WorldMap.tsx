import { useEffect, useMemo, useState } from 'react'
import type { District } from '../types'
import { movePlayer, nearestDistrict, type Direction } from '../lib/movement'
import { scenery } from '../art'
import { Building } from './Building'

type Props = {
  districts: District[]
  selected?: District
  onSelect: (district: District) => void
}

export function WorldMap({ districts, selected, onSelect }: Props) {
  const [position, setPosition] = useState({ x: 49, y: 49 })
  const [facing, setFacing] = useState<Direction>('down')
  const nearby = useMemo(() => nearestDistrict(position, districts), [districts, position])

  function move(direction: Direction) {
    setFacing(direction)
    setPosition((current) => movePlayer(current, direction))
  }

  function explore() {
    if (nearby) onSelect(nearby)
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const directionByKey: Record<string, Direction | undefined> = {
        ArrowUp: 'up', w: 'up', W: 'up',
        ArrowDown: 'down', s: 'down', S: 'down',
        ArrowLeft: 'left', a: 'left', A: 'left',
        ArrowRight: 'right', d: 'right', D: 'right',
      }
      const direction = directionByKey[event.key]
      if (direction) {
        event.preventDefault()
        move(direction)
      } else if ((event.key === 'e' || event.key === 'E' || event.key === 'Enter') && nearby) {
        event.preventDefault()
        onSelect(nearby)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nearby, onSelect])

  return (
    <section className="world" aria-label="Repository world map">
      <div className="sun-glow" />
      <div className="path horizontal" />
      <div className="path vertical" />
      <div className="river"><i /><i /><i /></div>
      <div className="bridge"><i /><i /><i /><i /></div>
      <div className="crop-field field-one">
        {scenery.crops.map((crop) => <img key={crop} src={crop} alt="" />)}
      </div>
      <div className="crop-field field-two">
        {scenery.crops.slice(2).map((crop) => <img key={crop} src={crop} alt="" />)}
      </div>
      <div className="forest forest-one">
        {[...scenery.trees, scenery.trees[0]].map((tree, index) => <img key={`${tree}-${index}`} src={tree} alt="" />)}
      </div>
      <div className="forest forest-two">
        {scenery.trees.map((tree) => <img key={tree} src={tree} alt="" />)}
      </div>
      <div className="flowers flowers-one" aria-hidden="true">
        <img src={scenery.flower} alt="" /><img src={scenery.mushrooms} alt="" /><img src={scenery.flower} alt="" />
      </div>
      <div className="flowers flowers-two" aria-hidden="true">
        <img src={scenery.flower} alt="" /><img src={scenery.mushrooms} alt="" />
      </div>
      <div className="fence fence-one" />
      <div className="fence fence-two" />
      <div className="farm-animals" aria-hidden="true">
        {scenery.animals.map((animal) => <img key={animal} src={animal} alt="" />)}
      </div>
      {districts.map((district) => (
        <Building
          key={district.id}
          district={district}
          active={selected?.id === district.id}
          nearby={nearby?.id === district.id}
          onSelect={onSelect}
        />
      ))}
      <div
        className={`player facing-${facing}`}
        style={{ left: `${position.x}%`, top: `${position.y}%` }}
        aria-label="Explorer character"
      ><img src={scenery.player} alt="" /></div>
      <div className={`proximity-hint${nearby ? ' visible' : ''}`}>
        {nearby ? <><kbd>E</kbd> EXPLORE {nearby.label}</> : 'FOLLOW THE PATH TO A BUILDING'}
      </div>
      <div className="map-hint">WASD / ARROWS TO WALK · E TO EXPLORE</div>
      <div className="movement-controls" aria-label="Character movement controls">
        <button onClick={() => move('up')} aria-label="Move up">▲</button>
        <button onClick={() => move('left')} aria-label="Move left">◀</button>
        <button className="explore-button" onClick={explore} disabled={!nearby} aria-label="Explore nearby building">E</button>
        <button onClick={() => move('right')} aria-label="Move right">▶</button>
        <button onClick={() => move('down')} aria-label="Move down">▼</button>
      </div>
    </section>
  )
}
