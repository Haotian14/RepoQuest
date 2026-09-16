import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { District } from '../types'
import { movePlayer, nearestDistrict, type Direction } from '../lib/movement'
import { explorerSprite } from '../art'
import { Building } from './Building'

type Props = {
  districts: District[]
  selected?: District
  onSelect: (district: District) => void
}

export function WorldMap({ districts, selected, onSelect }: Props) {
  const [position, setPosition] = useState({ x: 49, y: 49 })
  const [facing, setFacing] = useState<Direction>('down')
  const [walkFrame, setWalkFrame] = useState(1)
  const worldRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const walkTimerRef = useRef<number | undefined>(undefined)
  const nearby = useMemo(() => nearestDistrict(position, districts), [districts, position])
  const directionRow: Record<Direction, number> = { up: 0, left: 1, down: 2, right: 3 }

  function move(direction: Direction) {
    setFacing(direction)
    setWalkFrame((current) => current === 0 ? 2 : 0)
    setPosition((current) => movePlayer(current, direction))
    window.clearTimeout(walkTimerRef.current)
    walkTimerRef.current = window.setTimeout(() => setWalkFrame(1), 120)
  }

  function explore() {
    if (nearby) onSelect(nearby)
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    function centerMap() {
      if (window.matchMedia('(max-width: 850px)').matches) {
        viewport!.scrollLeft = (viewport!.scrollWidth - viewport!.clientWidth) / 2
      }
    }
    centerMap()
    window.addEventListener('resize', centerMap)
    return () => window.removeEventListener('resize', centerMap)
  }, [])

  useEffect(() => () => window.clearTimeout(walkTimerRef.current), [])

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return
      if (event.key === 'Enter' && event.target instanceof Element && event.target.closest('button, a')) return
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

  return (
    <div className="world-stage">
      <div className="world-viewport" ref={viewportRef}>
        <section
          className="world"
          id="repository-map"
          aria-label="Repository world map. Focus this area to move with WASD or arrow keys."
          ref={worldRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <div className="world-light" aria-hidden="true" />
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
            style={{ left: `${position.x}%`, top: `${position.y}%`, zIndex: 100 + Math.round(position.y) }}
            aria-label="Explorer character"
          >
            <span
              className="player-sprite"
              aria-hidden="true"
              style={{
                backgroundImage: `url(${explorerSprite})`,
                backgroundPosition: `${-walkFrame * 48}px ${-directionRow[facing] * 64}px`,
              }}
            />
          </div>
          <div className={`proximity-hint${nearby ? ' visible' : ''}`}>
            {nearby ? <><kbd>E</kbd> EXPLORE {nearby.label}</> : 'FOLLOW THE PATH TO A BUILDING'}
          </div>
          <div className="map-hint"><span>WASD / ARROWS</span> WALK <i /> <span>E / ENTER</span> EXPLORE</div>
        </section>
      </div>
      <div className="map-compass" aria-hidden="true"><span>N</span><i /></div>
      <div className="swipe-hint" aria-hidden="true">↔ &nbsp;DRAG TO EXPLORE</div>
      <div className="movement-controls" role="group" aria-label="Character movement controls">
        <button onClick={() => move('up')} aria-label="Move up">▲</button>
        <button onClick={() => move('left')} aria-label="Move left">◀</button>
        <button className="explore-button" onClick={explore} disabled={!nearby} aria-label="Explore nearby building">E</button>
        <button onClick={() => move('right')} aria-label="Move right">▶</button>
        <button onClick={() => move('down')} aria-label="Move down">▼</button>
      </div>
    </div>
  )
}
