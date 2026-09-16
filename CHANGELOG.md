# Changelog

All notable changes to RepoQuest are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Optional local GitHub token support
- Source previews from smart-guide routes

## [0.3.0] - 2026-09-16

### Added

- Shareable `?repo=owner/name` expedition links with browser history support
- Recent repository shortcuts stored locally with an in-app clear action
- Latest-commit district hotspots and changed-file priority in the inspector
- Direct GitHub source links from nearby files and smart-guide routes
- Partial-data warnings for truncated trees, file limits, and optional API failures
- Contributor guidance, issue forms, pull-request template, and a maintained changelog

### Changed

- Added request cancellation and stale-response protection when switching repositories
- Improved mobile camera following, persistent touch controls, focus behavior, typography, and contrast
- Pinned the development toolchain and aligned CI with the documented npm version

### Fixed

- GitHub URLs containing query strings or repository subpaths now resolve correctly
- Empty repositories and optional network failures degrade gracefully
- Large latest commits disclose when changed-file highlights are partial

## [0.2.0] - 2026-09-16

### Added

- Commit-history quests with device-local review progress
- Issue and pull-request boss encounters with local victory tracking
- High-resolution repository map card export
- Local smart guides with district roles, key files, and reading routes
- Depth-based building transparency when the explorer walks behind structures
- Unit and component coverage for map, movement, GitHub normalization, progress, sharing, artwork, and guide behavior

### Changed

- Refined the repository valley into a responsive, polished pixel-world interface
- Added openly licensed LPC buildings and explorer artwork with attribution

### Fixed

- Corrected explorer facing direction during horizontal and vertical movement
- Corrected world-object occlusion around buildings

## [0.1.0] - 2026-09-16

### Added

- Public GitHub repository loading
- Deterministic district generation from repository file trees
- File and district inspector
- Keyboard, arrow-key, and touch movement
- GitHub Actions verification and GitHub Pages deployment
