# Contributing to RepoQuest

Thanks for helping make source-code exploration more playful. Bug reports, accessibility improvements, documentation fixes, new tests, and focused feature proposals are welcome.

## Development setup

RepoQuest requires Node.js 22.13 or newer and npm 11.

```bash
git clone https://github.com/Haotian14/RepoQuest.git
cd RepoQuest
npm ci
npm run dev
```

The local development server is available at `http://localhost:5173` by default. RepoQuest includes a demo repository, so no GitHub credentials are required.

## Before making a change

1. Search existing issues before opening a new one.
2. Keep a pull request focused on one problem or feature.
3. For visual changes, include before-and-after screenshots at desktop and mobile widths.
4. Do not commit secrets, GitHub tokens, generated `dist` files, or unlicensed artwork.
5. Preserve attribution when modifying or replacing anything in `src/assets/lpc`.

## Code map

- `src/components`: React interfaces and interactive sections
- `src/lib`: pure data, map, movement, storage, and guide logic
- `src/assets`: project artwork and attributed third-party assets
- `src/test`: shared test setup
- `.github/workflows`: CI and Pages deployment

Prefer pure functions in `src/lib` for data transformations and keep network normalization separate from rendering. Add or update tests alongside behavior changes.

## Validation

Run the same essential checks used by CI:

```bash
npm test
npm run build
```

Also test relevant keyboard and touch interactions manually when changing movement, proximity actions, focus behavior, or responsive layouts.

## Commit and pull-request guidance

- Use a short, imperative commit subject, for example `fix: preserve explorer direction near buildings`.
- Explain the user-visible problem and the chosen solution in the pull request.
- Link the related issue when one exists.
- List the commands and manual scenarios used for validation.
- Call out data-limit, accessibility, performance, or licensing implications.

Maintainers may ask for a change to be split if it combines unrelated behavior, refactoring, and visual work.

## Reporting security issues

Do not include secrets or sensitive account data in a public issue. RepoQuest currently reads public GitHub data without authentication. If a future vulnerability could expose user data or credentials, contact the repository owner privately through their GitHub profile before publishing details.

## Artwork and licensing

Source code contributions are accepted under the repository's MIT License. Artwork may use a different license. Before adding visual assets, include the creator, source URL, exact license, local file paths, and a description of modifications in `THIRD_PARTY_ASSETS.md`. Share-alike assets must retain their original license obligations.
