export interface BuildArgsOptions {
    inputPath: string;
    outputPath: string;
    operation: string;
    outputFormat: string;
    isAudioFile: boolean;
    compressionMode: string;
    preset: string;
    crf: number;
}

export const buildFfmpegArgs = (options: BuildArgsOptions): string[] => {
    const { inputPath, outputPath, operation, outputFormat, isAudioFile, compressionMode, preset, crf } = options;
    let args: string[] = ['-i', inputPath];

    if (isAudioFile) {
        args.push('-vn');
    }

    // --------------------------------------------------------
    // Compression branch
    // --------------------------------------------------------
    if (operation === 'compress') {
        // Compression preset mappings
        let targetCrf = '26';
        let targetPreset = 'fast';
        if (compressionMode === 'low') { targetCrf = '21'; targetPreset = 'medium'; }
        if (compressionMode === 'high') { targetCrf = '30'; targetPreset = 'veryfast'; }

        if (isAudioFile) {
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

    // --------------------------------------------------------
    // Reencode branch
    // --------------------------------------------------------

    // TODO reencoding mp3 fails immediately with error code 234 probably because the 2nd stream is the thumbnail
    // which ffmpeg cannot reencode. We need to either ignore the thumbnail stream or remove it before reencoding
    else if (operation === 'reencode') {
        if (isAudioFile) {
            args.push('-c:a', 'aac', '-b:a', '192k');
        } else {
            args.push('-c:v', 'libx264', '-preset', preset, '-crf', crf.toString(), '-c:a', 'aac');
        }
    }

    // --------------------------------------------------------
    // Conversion branch
    // --------------------------------------------------------
    else if (operation === 'convert') {
        // Related to the above TODO, we need to handle the thumbnail stream properly for conversion as well
        // Because even if we are successfully converting an audio file the output file has no thumbnail
        if (isAudioFile) {
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
    } else {
        throw new Error(`Unsupported operation: ${operation}`);
    }

    args.push(outputPath);
    return args;
};