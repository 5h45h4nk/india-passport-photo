# Passport Studio

A browser-based Indian passport photo cropper built around supplied 630 × 810 pixel guidelines.

Live app: https://5h45h4nk.github.io/india-passport-photo/

## Features

- Upload JPG, PNG, or WebP, drag to position, and zoom.
- Export exactly 630 × 810 pixels as JPG or PNG.
- Run advisory checks for face count, head coverage, centering, pose, open eyes, expression, background, lighting, red-eye, and sharpness.
- View warnings beside the photo; passing checks are collapsed.
- Process photos on-device using MediaPipe models and WebAssembly in a browser worker. Photos are not uploaded.

## Run locally

No build step or package installation is required. From the repository root:

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. Serve over HTTP locally or HTTPS when hosted; opening index.html directly will not support the worker and models. The first analysis downloads the bundled model/runtime files and may take longer.

## Validate

Requires Node.js:

```sh
node --test tests/analysis.test.mjs
node --check dist/app.js
node --check dist/check-worker.js
```

## Files

- `dist/`: static app, analysis worker, and bundled models/runtime.
- `tests/analysis.test.mjs`: heuristic regression tests with synthetic fixtures.
- `.openai/hosting.json`: existing private Sites deployment identity.

## Limitations

Checks are estimates and do not guarantee passport acceptance. Head coverage uses estimated vertical hair-to-chin height. Natural skin tones, subtle shadows/reflections, religious or medical exceptions, and unobstructed eye visibility cannot be certified. Sunglasses detection is not implemented; landmarks can be estimated behind sunglasses. The background is preserved, not replaced.

The app follows the supplied screenshot's requirements; confirm current requirements and upload limits with the relevant application portal.

## Third-party assets

MediaPipe Tasks Vision 0.10.22-rc.20250304 and its WebAssembly runtime are bundled under `dist/vendor/`; see `dist/vendor/LICENSE`. Models are Google's MediaPipe Face Landmarker and Selfie Multiclass 256 × 256, downloaded from Google's MediaPipe model distribution. The UI uses Google Fonts when available, with local font fallbacks.

## GitHub Pages deployment

Pushes to `main` run the analysis tests and deploy `dist/` using `.github/workflows/deploy-pages.yml`. No server or secrets are needed. All worker, model, and runtime paths are relative so the app works under the repository URL.
