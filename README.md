<div align="center">

# 🗺️ RepoQuest

**Turn any GitHub repository into an explorable pixel world.**

[Live demo](https://haotian14.github.io/RepoQuest/) · [Roadmap](#roadmap) · [Contributing](#contributing)

</div>

RepoQuest transforms the structure of a public GitHub repository into a playful 2D map. Folders become districts, files become places, and the size of each district reflects the amount of code it contains.

## Features

- Explore any public GitHub repository without signing in
- Generate a deterministic 2D pixel map from its file tree
- Walk around with WASD, arrow keys, or touch controls
- Approach buildings and press `E` to explore folders
- Inspect top-level folders, file counts, sizes, and nearby files
- Responsive interface for desktop and mobile
- No backend and no stored repository data

## Quick start

```bash
git clone https://github.com/Haotian14/RepoQuest.git
cd RepoQuest
npm install
npm run dev
```

Open `http://localhost:5173` and enter a repository as either `owner/repository` or a complete GitHub URL.

## How it works

1. RepoQuest reads repository metadata using GitHub's public REST API.
2. The recursive Git tree is grouped by top-level folder.
3. The largest groups are assigned districts in the world.
4. File count controls building level; file size powers district statistics.

Unauthenticated GitHub API requests are rate limited. A future release will support optional local tokens and private repositories.

## Scripts

```bash
npm run dev       # development server
npm test          # unit tests
npm run build     # type-check and production build
npm run preview   # preview the production build
```

## Roadmap

- [x] Public repository exploration
- [x] Pixel districts and file inspector
- [x] Walkable character and keyboard navigation
- [ ] Commit-history quests
- [ ] Issue and pull-request boss battles
- [ ] Shareable map screenshots
- [ ] Optional AI explanations

## Contributing

Ideas, bug reports, and pull requests are welcome. Please run `npm test` and `npm run build` before opening a pull request.

## License

[MIT](LICENSE)
