# Passport Studio

A browser-based Indian passport photo cropper built around supplied 630 × 810 pixel guidelines.

Live app: https://5h45h4nk.github.io/india-passport-photo/

## Features

- Upload JPG, PNG, or WebP, drag to position, and zoom.
- Use a webcam with live on-device checks, choose a camera (including iPhone Continuity Camera when exposed by the browser), and capture a still.
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
node --test tests/*.test.mjs
node --check dist/app.js
node --check dist/check-worker.js
```

## Files

- `dist/`: static app, analysis worker, and bundled models/runtime.
- `tests/analysis.test.mjs`: heuristic regression tests with synthetic fixtures.
- `.openai/hosting.json`: existing private Sites deployment identity.

## Limitations

Checks are estimates and do not guarantee passport acceptance. Head coverage uses estimated vertical hair-to-chin height. Natural skin tones, subtle shadows/reflections, religious or medical exceptions, and unobstructed eye visibility cannot be certified. Sunglasses detection is not implemented; landmarks can be estimated behind sunglasses. Optional white-background replacement uses on-device segmentation and may leave halos or remove fine hair; inspect the output. The original image remains available when the option is off.

The app follows the supplied screenshot's requirements; confirm current requirements and upload limits with the relevant application portal.

## Third-party assets

MediaPipe Tasks Vision 0.10.22-rc.20250304 and its WebAssembly runtime are bundled under `dist/vendor/`; see `dist/vendor/LICENSE`. Models are Google's MediaPipe Face Landmarker and Selfie Multiclass 256 × 256, downloaded from Google's MediaPipe model distribution. The UI uses Google Fonts when available, with local font fallbacks.

## GitHub Pages deployment

Pushes to `main` run the analysis tests and deploy `dist/` using `.github/workflows/deploy-pages.yml`. No server or secrets are needed. All worker, model, and runtime paths are relative so the app works under the repository URL.

## Camera capture

Choose **Use camera** and allow camera permission. Microphone access is never requested. Select an available camera from the dropdown; refresh the list after connecting a device. Live frames are sampled for checks about once per second (slower on some devices). The preview stays live independently of analysis. Capture preserves the camera frame at its delivered resolution and the current crop; the camera stops, and checks rerun on the still photo. Camera access also stops on Stop camera, upload mode, tab hiding, page exit, or disconnection.

For an iPhone webcam on a Mac, set up [Apple Continuity Camera](https://support.apple.com/en-us/102546). The iPhone must be exposed by the OS and browser to appear in the selector. If the in-app browser does not offer camera access, open the GitHub Pages URL in Safari or Chrome. Use an even white backdrop; disable portrait blur or other camera effects. Capture is from the browser video stream, not the iPhone’s full-resolution native Camera app.

## White background option

Enable **Make background white** for an uploaded or captured still. The existing portrait segmentation model supplies background probabilities; foreground colors are retained and uncertain edges feather onto white. The final composited pixels are used by the checks and download. Export is disabled until replacement completes; turn the option off to restore the original crop. In camera mode, replacement applies after capture; live preview and live checks use the original camera frame. Fine hair, translucent items and complex backgrounds can produce artifacts.

## Automatic framing

New uploads and captured stills auto-frame by default; disable **Auto-frame new photos** to retain your own crop. **Auto-frame** analyzes the full original photo with the existing model worker, estimates the hair-to-chin bounds, and aims for 82.5% vertical head coverage with horizontal centering. Wide hair, image edges, and the 4× zoom limit can constrain the result. It does not reconstruct clipped hair or chin, and leaves uncertain or multiple-face cases for manual framing. Dragging or adjusting zoom cancels a pending automatic adjustment. Checks and optional white-background replacement rerun after the crop changes.

## Camera resolution

The app requests high ideal dimensions without a fixed aspect ratio, then queries the selected track’s width/height capabilities and requests the reported maximums with ideal constraints. It prefers native frames and a modest frame rate over 1080p video. If capability negotiation is unsupported or rejected, the working stream remains usable. The actual original dimensions are shown above Zoom. Capture keeps the delivered video frame resolution; browser video limits may be lower than the native iPhone Camera app’s still-photo resolution.

## Dedicated camera panel

**Use camera** opens a modal capture workspace with a large preview, live pass/fail results, camera flip/settings, and an always-visible capture button. On phones it fills the viewport; desktop uses side-by-side preview and checks. Capture stops the camera, restores the editor controls, and triggers auto-framing when enabled. Closing or pressing Escape stops capture and restores the previous crop. The panel reuses the existing canvas and model worker.
