import cottageSlate from './assets/lpc/farm/cottage-slate.png'
import cottageThatch from './assets/lpc/farm/cottage-thatch.png'
import siloSlate from './assets/lpc/farm/silo-slate.png'
import siloThatch from './assets/lpc/farm/silo-thatch.png'
import coop from './assets/lpc/farm/coop.png'
import player from './assets/lpc/character/explorer-walk.png'

export type BuildingArchetype = {
  className: string
  main: string
  secondary?: string
  accessory?: string
  marker: string
}

export function buildingArchetype(path: string, label: string): BuildingArchetype {
  const value = `${path} ${label}`.toLowerCase()

  if (path === 'root') return { className: 'town-hall', main: cottageSlate, accessory: siloSlate, marker: 'HQ' }
  if (/src|app|api|server|lib/.test(value)) return { className: 'workshop', main: cottageSlate, accessory: siloThatch, marker: 'DEV' }
  if (/doc|readme|guide|wiki/.test(value)) return { className: 'library', main: cottageSlate, accessory: coop, marker: 'DOC' }
  if (/test|spec|e2e/.test(value)) return { className: 'guild', main: cottageThatch, accessory: coop, marker: 'QA' }
  if (/public|asset|static|image/.test(value)) return { className: 'storehouse', main: cottageThatch, secondary: cottageSlate, marker: 'ART' }
  if (/config|github|script|tool/.test(value)) return { className: 'tower', main: cottageSlate, accessory: siloSlate, marker: 'OPS' }

  return label.length % 2 === 0
    ? { className: 'cottage slate', main: cottageSlate, marker: 'CODE' }
    : { className: 'cottage thatch', main: cottageThatch, marker: 'CODE' }
}

export const explorerSprite = player
