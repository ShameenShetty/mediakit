import { inputFileTypes } from '../constants/mediaOptions';

export interface BuildArgsOptions {
    inputPath: string;
    outputPath: string;
    operation: string;
    outputFormat: string;
    fileType: inputFileTypes
    compressionMode: string;
    preset: string;
    crf: number;
}

export const buildMediaArgs = (options: BuildArgsOptions): string[] => {
    const { inputPath, outputPath, operation, outputFormat, fileType, compressionMode, preset, crf } = options;
    let args: string[] = ['-i', inputPath];

    if (fileType === 'audio') {
        args.push('-vn');
    }

    // --------------------------------------------------------
    // Conversion branch
    // --------------------------------------------------------
    if (operation === 'convert') {
        if (fileType === 'audio') {
            if (outputFormat === 'mp3') {
                args.push('-c:a', 'libmp3lame', '-b:a', '192k');
            } else if (outputFormat === 'm4a') {
                args.push('-c:a', 'aac', '-b:a', '192k');
            } else if (outputFormat === 'opus') {
                args.push('-c:a', 'libopus', '-b:a', '128k');
            } else if (outputFormat === 'wav') {
                // Force uncompressed standard PCM 16-bit stereo for clean WAV playback
                args.push('-c:a', 'pcm_s16le');
            } else {
                args.push('-c:a', 'aac');
            }
        } else if (fileType === 'image') {
            // Image conversion branch dynamically mapped from the CRF slider (0 to 51)
            if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
                // MJPEG -q:v scale: 1 (best quality) to 31 (lowest quality). Lower is better.
                // Maps CRF 0 -> 1 and CRF 51 -> 31
                const mjpegQuality = Math.max(1, Math.min(31, Math.round((crf / 51) * 30) + 1));
                args.push('-c:v', 'mjpeg', '-q:v', mjpegQuality.toString());
            } else if (outputFormat === 'png') {
                // PNG compression_level: 0 (fast, larger file) to 9 (slow, max compression). Lossless.
                // Maps CRF 0 -> 0 and CRF 51 -> 9
                const pngLevel = Math.max(0, Math.min(9, Math.round((crf / 51) * 9)));
                args.push('-c:v', 'png', '-compression_level', pngLevel.toString());
            } else if (outputFormat === 'avif') {
                // Swapped to libsvtav1 (or remove if your binary lacks AV1 encoders entirely).
                // SVT-AV1 uses a CRF scale very close to 0-63, so we can map CRF directly.
                const avifCrf = Math.max(0, Math.min(63, crf));
                args.push('-c:v', 'libsvtav1', '-crf', avifCrf.toString(), '-pix_fmt', 'yuv420p');
            } else {
                args.push('-q:v', '2');
            }
        } else {
            // Video conversion branch
            if (outputFormat === 'webm') {
                // Map H.264 presets to VP9 -cpu-used values (0 to 5)
                let cpuUsed = '2'; // default / medium equivalent
                if (preset === 'veryfast') cpuUsed = '4';
                else if (preset === 'fast') cpuUsed = '3';
                else if (preset === 'medium') cpuUsed = '2';
                else if (preset === 'slow') cpuUsed = '0'; // slow takes maximum CPU for best compression

                args.push(
                    '-c:v', 'libvpx-vp9',
                    '-crf', crf.toString(),
                    '-b:v', '0',               // Required for constant quality mode in VP9
                    '-cpu-used', cpuUsed,      // Controls encoding speed vs quality
                    '-row-mt', '1',            // Enables multi-threading for faster processing
                    '-c:a', 'libopus'
                );
            } else {
                // Standard H.264/AAC for MP4, MKV, MOV
                args.push(
                    '-c:v', 'libx264',
                    '-preset', preset,
                    '-crf', crf.toString(),
                    '-c:a', 'aac'
                );
            }
        }
    }

    // --------------------------------------------------------
    // Reencode branch
    // --------------------------------------------------------
    else if (operation === 'reencode') {
        // For image file reencode operation is filtered out so we can assume if input
        // file is not audio file then it is a video file
        if (fileType === 'audio') {
            args.push('-c:a', 'aac', '-b:a', '192k');
        } else {
            args.push('-c:v', 'libx264', '-preset', preset, '-crf', crf.toString(), '-c:a', 'aac');
        }
    }

    // --------------------------------------------------------
    // Compression branch
    // --------------------------------------------------------
    else if (operation === 'compress') {
        // Compression preset mappings
        let targetCrf = '26';
        let targetPreset = 'fast';
        if (compressionMode === 'low') { targetCrf = '21'; targetPreset = 'medium'; }
        if (compressionMode === 'high') { targetCrf = '30'; targetPreset = 'veryfast'; }

        if (fileType === 'audio') {
            args.push('-c:a', 'libmp3lame', '-b:a', compressionMode === 'high' ? '96k' : '128k');
        } else {
            // Video compression branch with WebM/VP9 support
            if (outputFormat === 'webm') {
                let cpuUsed = '3'; // default / fast equivalent for compression
                if (targetPreset === 'veryfast') cpuUsed = '4';
                else if (targetPreset === 'fast') cpuUsed = '3';
                else if (targetPreset === 'medium') cpuUsed = '2';
                else if (targetPreset === 'slow') cpuUsed = '0';

                args.push(
                    '-c:v', 'libvpx-vp9',
                    '-crf', targetCrf,
                    '-b:v', '0',
                    '-cpu-used', cpuUsed,
                    '-row-mt', '1',
                    '-c:a', 'libopus',
                    '-b:a', '128k'
                );
            } else {
                args.push('-c:v', 'libx264', '-preset', targetPreset, '-crf', targetCrf, '-c:a', 'aac', '-b:a', '128k');
            }
        }
    }

    else {
        throw new Error(`Unsupported operation: ${operation}`);
    }

    args.push(outputPath);
    return args;
};