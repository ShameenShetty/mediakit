# Roadmap

Future milestones and planned architectural enhancements for MediaKit:

## 📋 Planned Features & Modules

- **Advanced File Compression:** Reduce video and audio file sizes by configuring custom target bitrates or encoding presets.
- **Audio Toolkit Extensions:** Expanded audio manipulation features, custom equalizer filters, and advanced audio track routing.
- **Dedicated Images Module & ImageMagick Suite:** Implement a dedicated image processing module featuring ImageMagick integration for advanced manipulation (watermarking, cropping, rotation, filters) and complete format compatibility (including WebP and AVIF encoding).
- **Enhanced Thumbnail Management:** Relocate thumbnail and cover art tools into the dedicated Images module, supporting batch extraction of frame thumbnails and automated multi-resolution artwork embedding.
- **Advanced Video Upscaling:** Further optimization and hardware-accelerated pipelines for GPU-based 4K video upscaling.

## 🎞️ Advanced Media Splicing & Preview

- **Embedded Media Player:** Integrate an embedded media player (e.g., HTML5 video/audio player or waveform visualization libraries) into the Clip & Cut module.
- **Interactive Range Sliders:** Add dynamic range sliders and dual scrubbers to visually adjust start and end cut points.
- **Live Preview Playback:** Implement live preview playback for selected cut segments prior to processing (similar to web tools like `mp3cut.net` or `online-video-cutter.com`).
- **Multi-Segment Timeline:** Support multi-segment timeline selection for cutting and merging multiple sections from a single source file.

## ⚙️ Performance, Architecture & System Workflows

- **Multi-Core Parallel Stream Chunking:** Implement segment-based parallel processing pipelines (splitting long audio and single-threaded conversion tasks into 15-minute chunks across CPU cores using the segment/concat muxer workflow) to slash execution times from minutes down to seconds.
- **Global State Persistence & Background Jobs:** Integrate a global state management layer (such as Zustand) to persist active transcoding and utility processes in the background, preventing UI resets when navigating between pages.
- **Batch Processing Queue:** Queue and process multiple files concurrently with unified progress tracking across all toolkits.
- **Container Metadata & Artwork Preservation:** Robust handling of container-specific quirks to preserve or strip/re-attach embedded cover art and thumbnail streams (ID3 APIC tags for MP3s, secondary video streams for M4A/MP4 containers) during format conversions and re-encoding passes.

## 🧪 Custom Advanced Recipes (Power User Module)

- **Custom FFmpeg Argument Builder:** Provide an advanced workspace for power users to write and execute raw custom FFmpeg command-line flag arrays (e.g., custom encoders, specialized pixel formats, bitrate caps).
- **Template Variable Substitution:** Support dynamic placeholders like `$INPUT` and `$OUTPUT` to seamlessly integrate custom argument strings into the Tauri execution pipeline.
- **Recipe Management & Persistence:** Allow users to save, name, describe, and load custom argument combinations as reusable "Recipes" stored locally.
- **Recipe Integration Across Toolkits:** Enable users to select saved recipes directly from standard operation dropdowns for extensible, customized media processing.