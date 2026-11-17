export interface ClipBuildArgsOptions {
    inputPath: string;
    outputPath: string;
    startTime: number;
    endTime: number;
    isAudioFile: boolean;
}

export const buildClipArgs = (options: ClipBuildArgsOptions): string[] => {
    const { inputPath, outputPath, startTime, endTime } = options;
    const duration = endTime - startTime;

    return [
        '-y',
        '-ss', startTime.toString(),
        '-i', inputPath,
        '-t', duration.toString(),
        '-c', 'copy',                       // Fast stream copy without re-encoding
        '-avoid_negative_ts', 'make_zero',  // Fixes initial player offset bugs in native media players
        outputPath
    ];
};