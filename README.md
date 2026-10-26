# FFmpeg GUI Desktop App

A lightweight, modern, and clean desktop GUI wrapper for **FFmpeg**, built with Tauri v2, React, TypeScript, and Mantine UI. 

Inspired by clean, modular interfaces like Pulsar, this application is designed as a fast, frictionless alternative to bulky transcoding suites like Handbrake or complex bash scripts, providing a streamlined workspace for everyday media tasks.

## 🚀 What It Does (v1 MVP)

Currently, the initial release focuses strictly on the absolute basics:
- **Single File Conversion:** Effortlessly convert a single video or audio file from one format to another with a clean, intuitive interface.
- **Native Local Processing:** Executes operations locally using a bundled FFmpeg binary wrapped securely inside a high-performance Tauri backend.

*Note: Advanced features such as compression, thumbnail manipulation, precise clipping, and audio adjustments are intentionally excluded from the initial release to keep the app focused, fast, and lightweight.*

---

## 📋 Planned Features

- **Advanced File Compression:** Reduce video and audio file sizes by configuring custom target bitrates or encoding presets.
- **Clipping & Trimming:** Specify start and end timestamps to cut and export precise segments of video or audio files.
- **Audio Toolkit:** Boost audio volume levels, strip audio tracks entirely, or perform dedicated audio extractions.
- **Thumbnail Management:** Extract thumbnail images from video/audio files, or embed custom image thumbnails into media files.
- **Video Upscaling:** Upscale videos to higher resolutions (such as 4K), beginning with CPU-based processing and later expanding to GPU hardware acceleration.
- **Batch Processing Queue:** Queue and process multiple files concurrently with unified progress tracking.