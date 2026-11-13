# MediaKit

A lightweight, modern, and clean desktop GUI wrapper for **FFmpeg**, built with Tauri v2, React, TypeScript, and Mantine UI. 

Inspired by clean, modular interfaces, MediaKit is designed as a fast, frictionless alternative to bulky transcoding suites like Handbrake or complex bash scripts, providing a streamlined local workspace for everyday media conversion, editing, and utility tasks.

## 🚀 Features & Modules

MediaKit has achieved 100% feature migration from legacy Bash automation scripts into a robust, high-performance local-first desktop application:

- **Image Conversion & Compression:** Effortlessly convert and compress static images across standard web formats (`.jpg`, `.jpeg`, `.png`, `.avif`) using optimized encoder mappings and real-time processing pipelines.
- **Clip & Cut Toolkit:** Fast stream-copy video/audio cutting using flexible timecode inputs (supporting raw seconds or `HH:MM:SS` formats) with in-app validation.
- **Audio Toolkit:** Extract audio tracks, boost volume levels, and mute or remove audio from media files.
- **Thumbnails & Artwork:** Extract frame thumbnails from video files or embed custom image artwork.
- **Format Conversion & Compression:** Effortlessly convert between various video and audio containers (such as MP4, WebM, M4A, AAC, MOV) and compress media files.
- **Video Upscaling:** Upscale video content to higher resolutions, supporting both CPU-based processing and GPU hardware acceleration.
- **Native Local Processing:** Executes operations locally using secure Tauri sidecar binaries with real-time progress tracking.