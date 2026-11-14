# TODO List

Tracked technical debt, architectural optimizations, and future enhancements across the MediaKit codebase.

## 📄 UI & Service Refactoring TODO: Simplifying Encoding Controls

### 1. UI Component Refactoring (Components & Layout)
- [ ] **Remove "Advanced Options" Collapsible/Accordion Wrapper:** 
  - Promote quality and effort selectors out of hidden drawers so they are visible by default in the main workflow card.
- [ ] **Replace CRF & Preset Sliders:**
  - **Video/Upscale:** Replace the 0–51 CRF slider and numeric quality sliders with a clean Mantine `<Select>` component for **Quality** (*Balanced*, *High Quality*, *Maximum Compression*) as well updating the help tooltip.
  - **Video Preset:** Replace the `veryfast`/`slow` preset selector with a dropdown for **Encoding Effort** (*Fast*, *Balanced*, *Maximum Compression*) as well updating the help tooltip.
- [ ] **Update State Management Hooks:**
  - Update `HomePage.tsx`, `UpscalePage.tsx`, and associated state hooks to store string tokens (`'balanced'`, `'high'`, `'compressed'`) instead of raw numbers.

### 2. Backend Service Remapping (`ffmpegServices.ts` & Upscale Services)
- [ ] **Map Video Quality Dropdown Tokens to Encoders:**
  - Map `'balanced'` $\rightarrow$ CRF `23` (H.264 / VP9) or quality `50` (VideoToolbox).
  - Map `'high'` $\rightarrow$ CRF `18` (H.264 / VP9) or quality `75` (VideoToolbox).
  - Map `'compressed'` $\rightarrow$ CRF `28` (H.264 / VP9) or quality `30` (VideoToolbox).
- [ ] **Map Encoding Effort Dropdown Tokens to Presets / CPU Threads:**
  - Map `'fast'` $\rightarrow$ Preset `veryfast` (H.264) / `-cpu-used 4` (VP9).
  - Map `'balanced'` $\rightarrow$ Preset `medium` (H.264) / `-cpu-used 2` (VP9).
  - Map `'maximum'` $\rightarrow$ Preset `slow` (H.264) / `-cpu-used 0` (VP9) for maximum compression efficiency.
- [ ] **Update Image Conversion & Compression Mappings:**
  - Ensure image quality dropdown selections correctly map to mathematical ranges for MJPEG (`-q:v`), PNG (`-compression_level`), and AVIF (`-crf`).

### 3. Testing & Verification
- [ ] **Verify End-to-End Command Building:**
  - Unit test `buildFfmpegArgs` to ensure selected dropdown labels correctly translate to valid CLI argument arrays without throwing undefined parameter errors.
- [ ] **UI Polish & Responsiveness:**
  - Verify that inline selectors fit gracefully across different window sizes in the Tauri desktop layout.

## 📄 `ClipCutPage.tsx`

- **Advanced Media Splicing & Preview**
  - Integrate an embedded media player (e.g. HTML5 video/audio player or wavesurfer.js for audio waveforms).
  - Add dynamic range slider / dual scrubbers to visually adjust start and end cut points.
  - Implement live preview playback for the selected cut segment prior to processing (similar to `mp3cut.net` / `online-video-cutter.com`).
  - Support multi-segment timeline selection (cutting multiple sections out of a single file and merging them).

---

## 📄 `HomePage.tsx`

- **State Persistence & Background Jobs**
  - If encoding something, switching over to another page causes the screen to reset even though the process is still running in the background. 
  - Investigate using Zustand to store the state of active processes or continue listening to the process streams globally in the background.

---

## 📄 `audioToolkitServices.ts`

- **Performance Optimization (Parallel Stream Chunking)**
  - Optimize long audio processing performance (currently takes ~2 mins for ~2 min files).
  - Implement parallel stream chunking similar to the bash `boostAudio.sh` script:
    1. Split input file into 15-minute segments using ffmpeg segment muxer (`-segment_time 900`).
    2. Process chunks in parallel across CPU cores using multi-threaded sidecar calls or worker threads.
    3. Generate a concat text manifest file listing all processed chunks.
    4. Re-combine chunks using the concat demuxer (`-f concat -safe 0`) while preserving original metadata.
  - *Target performance reduction:* bring execution time down from minutes to 5-10 seconds.

- **Album Art & Metadata Preservation**
  - Implement thumbnail/cover art preservation during audio extraction or boost/shrink operations.
  - Handle container-specific quirks:
    - For MP3 files, embedded artwork must be written into ID3 APIC metadata tags.
    - For M4A/MP4 containers, artwork needs to be attached as a secondary video stream.
  - Currently, operations strip or ignore existing embedded album art.

---

## 📄 `ffmpegServices.ts`

- **Audio Conversion Performance Optimization**
  - Optimize large audio file conversion performance. Currently, audio conversions run on a single core (unlike video processing, which utilizes multi-core hardware scaling).
  - Implement parallel stream chunking for audio conversion inputs:
    1. Split the source audio file into 15-minute segments using the segment muxer (`-segment_time 900`).
    2. Convert each chunk in parallel across available CPU cores using sidecar/worker threads.
    3. Build a concat text manifest file indexing all converted chunks.
    4. Re-combine the chunks using the concat demuxer (`-f concat -safe 0`) while preserving metadata.

- **ImageMagick Binary Integration**
  - Bundle the ImageMagick (`magick`) binary as a Tauri sidecar to handle robust, full-featured image format conversion and manipulation.
  - Bypass current FFmpeg static build limitations (such as missing `libwebp` encoder support) by routing image-specific operations through ImageMagick.
  - Enable high-performance, lossless and lossy handling across all standard web image formats (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`).

- **Thumbnail and Cover Art Stream Handling**
  - Implement thumbnail and cover art preservation during audio/video conversion operations.
  - Handle complex container format variations:
    - For MP3 files, embedded artwork must be encoded into ID3 APIC metadata tags.
    - For M4A, MP4, or other containers, artwork needs to be handled as a secondary attached picture stream.
  - Currently, format conversions strip or ignore embedded cover art and thumbnails.

- **Fix MP3 Re-encoding Crash**
  - Re-encoding MP3 fails immediately with error code `234`, likely because the second stream is the embedded thumbnail which FFmpeg cannot re-encode directly.
  - Implement logic to either ignore the thumbnail stream or strip/remove it before running the re-encoding pass.

## 📄 `UpscalePage.tsx`

- **Local ML Upscaling Model Downloads**
  - Implement dynamic prompt and downloader for optional lightweight ML upscaling models (e.g., Real-ESRGAN, Compact ONNX models around 1–2 GB).
  - Support choice between fast GPU/CPU hardware acceleration pipelines and high-quality neural upscaling for both static images and video files.