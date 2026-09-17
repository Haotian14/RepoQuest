import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { District } from '../types'
import { movePlayer, nearestDistrict, type Direction } from '../lib/movement'
import { depthForY, isOccludedByBuilding } from '../lib/depth'
import { repositoryTheme } from '../lib/map'
import { explorerDirectionRow, explorerSprite } from '../art'
import { Building } from './Building'

type Props = {
  districts: District[]
  selected?: District
  recentChangedPaths?: string[]
  currentPath?: string
  language?: string
  onSelect: (district: District) => void
  onNavigate?: (path: string) => void
}

const INITIAL_POSITION = { x: 49, y: 49 }

export function WorldMap({ districts, selected, recentChangedPaths = [], currentPath = '', language = 'Mixed', onSelect, onNavigate }: Props) {
  const [position, setPosition] = useState(INITIAL_POSITION)
  const [facing, setFacing] = useState<Direction>('down')
  const [walkFrame, setWalkFrame] = useState(1)
  const [controlsVisible, setControlsVisible] = useState(false)
  const worldRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const walkTimerRef = useRef<number | undefined>(undefined)
  const positionRef = useRef(INITIAL_POSITION)
  const nearby = useMemo(() => nearestDistrict(position, districts), [districts, position])
  const recentChangesByDistrict = useMemo(() => {
    const counts = new Map<string, number>()
    districts.forEach((district) => {
      const filePaths = new Set(district.files.map((file) => file.path))
      const count = recentChangedPaths.filter((path) => filePaths.has(path)).length
      if (count) counts.set(district.id, count)
    })
    return counts
  }, [districts, recentChangedPaths])
  const breadcrumbParts = currentPath ? currentPath.split('/') : []
  const theme = repositoryTheme(language)

  function followPlayer(nextPosition: typeof INITIAL_POSITION) {
    const viewport = viewportRef.current
    const world = worldRef.current
    if (!viewport || !world || !window.matchMedia('(max-width: 850px)').matches) return

    const targetLeft = (nextPosition.x / 100) * world.scrollWidth - viewport.clientWidth / 2
    const maxLeft = Math.max(0, world.scrollWidth - viewport.clientWidth)
    const left = Math.min(maxLeft, Math.max(0, targetLeft))
    if (typeof viewport.scrollTo === 'function') viewport.scrollTo({ left, behavior: 'auto' })
    else viewport.scrollLeft = left
  }

  function move(direction: Direction) {
    setFacing(direction)
    setWalkFrame((current) => current === 0 ? 2 : 0)
    setPosition((current) => {
      const next = movePlayer(current, direction)
      positionRef.current = next
      return next
    })
    window.clearTimeout(walkTimerRef.current)
    walkTimerRef.current = window.setTimeout(() => setWalkFrame(1), 120)
  }

  function explore() {
    if (nearby) onSelect(nearby)
  }

  useEffect(() => {
    function keepPlayerInView() {
      followPlayer(positionRef.current)
    }
    keepPlayerInView()
    window.addEventListener('resize', keepPlayerInView)
    return () => window.removeEventListener('resize', keepPlayerInView)
  }, [])

  useEffect(() => {
    followPlayer(position)
  }, [position])

  useEffect(() => {
    const restoreMapFocus = Boolean(worldRef.current?.contains(document.activeElement))
    positionRef.current = INITIAL_POSITION
    setPosition(INITIAL_POSITION)
    setFacing('down')
    setWalkFrame(1)
    window.clearTimeout(walkTimerRef.current)
    const frame = window.requestAnimationFrame(() => {
      followPlayer(INITIAL_POSITION)
      if (restoreMapFocus) worldRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [districts])

  useEffect(() => () => window.clearTimeout(walkTimerRef.current), [])

  useEffect(() => {
    const world = worldRef.current
    if (!world) return
    if (!('IntersectionObserver' in window)) {
      setControlsVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => setControlsVisible(entry.isIntersecting),
      { threshold: 0.12 },
    )
    observer.observe(world)
    return () => observer.disconnect()
  }, [])

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
      <nav className="map-navigation" aria-label="Repository map location">
        {currentPath && (
          <button className="map-back" type="button" onClick={() => onNavigate?.(breadcrumbParts.slice(0, -1).join('/'))}>← UP</button>
        )}
        <button type="button" aria-current={!currentPath ? 'location' : undefined} onClick={() => onNavigate?.('')}>ROOT</button>
        {breadcrumbParts.map((part, index) => {
          const path = breadcrumbParts.slice(0, index + 1).join('/')
          const isCurrent = index === breadcrumbParts.length - 1
          return (
            <span key={path}>
              <i aria-hidden="true">/</i>
              <button type="button" aria-current={isCurrent ? 'location' : undefined} onClick={() => onNavigate?.(path)}>{part}</button>
            </span>
          )
        })}
        <span className={`map-theme theme-${theme}`}><i />{theme.toUpperCase()} BIOME</span>
      </nav>
      <div className="world-viewport" ref={viewportRef}>
        <section
          className={`world world-theme-${theme}`}
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
              occluded={isOccludedByBuilding(position, district)}
              recentChangeCount={recentChangesByDistrict.get(district.id)}
              onSelect={onSelect}
            />
          ))}
          <div
            className={`player facing-${facing}`}
            style={{ left: `${position.x}%`, top: `${position.y}%`, zIndex: depthForY(position.y) }}
            role="img"
            aria-label="Explorer character"
          >
            <span
              className="player-sprite"
              aria-hidden="true"
              style={{
                backgroundImage: `url(${explorerSprite})`,
                backgroundPosition: `${-walkFrame * 48}px ${-explorerDirectionRow[facing] * 64}px`,
              }}
            />
          </div>
          <div className={`proximity-hint${nearby ? ' visible' : ''}`}>
            {nearby ? <><kbd>E</kbd> {nearby.canEnter ? 'ENTER' : 'EXPLORE'} {nearby.label}</> : 'FOLLOW THE PATH TO A BUILDING'}
          </div>
          <div className="map-hint"><span>WASD / ARROWS</span> WALK <i /> <span>E / ENTER</span> EXPLORE</div>
        </section>
      </div>
      <div className="map-compass" aria-hidden="true"><span>N</span><i /></div>
      <div className="swipe-hint" aria-hidden="true">↔ &nbsp;DRAG TO EXPLORE</div>
      <div className={`movement-controls${controlsVisible ? ' controls-visible' : ''}`} role="group" aria-label="Character movement controls">
        <button onClick={() => move('up')} aria-label="Move up">▲</button>
        <button onClick={() => move('left')} aria-label="Move left">◀</button>
        <button className="explore-button" onClick={explore} disabled={!nearby} aria-label="Explore nearby building">E</button>
        <button onClick={() => move('right')} aria-label="Move right">▶</button>
        <button onClick={() => move('down')} aria-label="Move down">▼</button>
      </div>
    </div>
  )
}
