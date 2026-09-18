# Showcase assets

RepoQuest keeps its public-facing screenshots and release artwork in `docs/images`.

| Asset | Purpose | Size |
| --- | --- | --- |
| `desktop-home.jpg` | Landing-page screenshot | 1348 × 926 |
| `desktop-map.jpg` | Repository-map screenshot | 1348 × 926 |
| `source-preview.jpg` | In-site source drawer screenshot | 1363 × 936 |
| `demo.gif` | 20-second README walkthrough | 960 × 540 |
| `social-preview.png` | GitHub repository social preview | 1280 × 640 |

The screenshots come from the deployed site. After replacing one or more screenshots, regenerate the derived assets with:

```bash
./scripts/create-showcase-assets.sh
```

The script requires ImageMagick and FFmpeg. Upload `social-preview.png` under **Settings → General → Social preview** after it changes.
