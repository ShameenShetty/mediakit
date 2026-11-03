// src/utils/buildFfmpegArgs.ts
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

    if (operation === 'compress') {
        let targetCrf = '26';
        let targetPreset = 'fast';
        if (compressionMode === 'low') { targetCrf = '21'; targetPreset = 'medium'; }
        if (compressionMode === 'high') { targetCrf = '30'; targetPreset = 'veryfast'; }

        if (isAudioFile) {
            args.push('-c:a', 'libmp3lame', '-b:a', compressionMode === 'high' ? '96k' : '128k');
        } else {
            if (outputFormat === 'webm') {
                let cpuUsed = '3';
                if (targetPreset === 'veryfast') cpuUsed = '4';
                else if (targetPreset === 'fast') cpuUsed = '3';
                else if (targetPreset === 'medium') cpuUsed = '2';
                else if (targetPreset === 'slow') cpuUsed = '0';

                args.push('-c:v', 'libvpx-vp9', '-crf', targetCrf, '-b:v', '0', '-cpu-used', cpuUsed, '-row-mt', '1', '-c:a', 'libopus', '-b:a', '128k');
            } else {
                args.push('-c:v', 'libx264', '-preset', targetPreset, '-crf', targetCrf, '-c:a', 'aac', '-b:a', '128k');
            }
        }
    } else if (operation === 'reencode') {
        if (isAudioFile) {
            args.push('-c:a', 'aac', '-b:a', '192k');
        } else {
            args.push('-c:v', 'libx264', '-preset', preset, '-crf', crf.toString(), '-c:a', 'aac');
        }
    } else {
        // conversion branch logic...
        // (Move the rest of your conversion format switches here)
    }

    args.push(outputPath);
    return args;
};