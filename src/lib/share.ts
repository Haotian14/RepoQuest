export function shareFilename(owner: string, name: string) {
  const repository = `${owner}-${name}`
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `repoquest-${repository || 'repository'}.png`
}
