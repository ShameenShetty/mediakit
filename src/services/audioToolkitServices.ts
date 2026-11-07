export interface AudioBuildArgsOptions {
    inputPath: string;
    outputPath: string;
    operation: 'extract' | 'boost-shrink' | 'mute';
    volumeMultiplier?: number | string;
    isAudioFile: boolean;
}

// TODO: Optimize long audio processing performance (currently takes ~2 mins for ~2 min files).
// Implement parallel stream chunking similar to the bash boostAudio.sh script:
// 1. Split input file into 15-minute segments using ffmpeg segment muxer (`-segment_time 900`).
// 2. Process chunks in parallel across CPU cores using multi-threaded sidecar calls or worker threads.
// 3. Generate a concat text manifest file listing all processed chunks.
// 4. Re-combine chunks using the concat demuxer (`-f concat -safe 0`) while preserving original metadata.
// Target performance reduction: bring execution time down from minutes to 5-10 seconds.

// TODO: Implement thumbnail/cover art preservation during audio extraction or boost/shrink operations.
// This requires handling container-specific quirks:
// - For MP3 files, embedded artwork must be written into ID3 APIC metadata tags.
// - For M4A/MP4 containers, artwork needs to be attached as a secondary video stream.
// Currently, operations strip or ignore existing embedded album art.
export const buildAudioArgs = (options: AudioBuildArgsOptions): string[] => {
    const { inputPath, outputPath, operation, volumeMultiplier = '1.0', isAudioFile } = options;

    let args: string[] = ['-i', inputPath];

    if (isAudioFile) {
        console.log('Audio file');
        if (operation === 'extract') {
            args.push('-c:a', 'aac', '-b:a', '192k');
        } else if (operation === 'boost-shrink') {
            const isMp3Output = outputPath.toLowerCase().endsWith('.mp3');
            const audioCodec = isMp3Output ? 'libmp3lame' : 'aac';
            const audioBitrate = isMp3Output ? '192k' : '256k';

            args = [
                '-y',
                '-i', inputPath,
                '-vn',                  // Strip video / attached cover art
                '-map', '0:a?',         // Optional stream mapping to safely handle both MP3 and M4A
                '-filter:a', `volume=${volumeMultiplier}`,
                '-c:a', audioCodec,
                '-b:a', audioBitrate,
                outputPath
            ];
            return args;
        } else if (operation === 'mute') {
            args.push('-c:a', 'an');
        }
    } else {
        console.log('Video file');
        // --- VIDEO FILE LOGIC ---
        if (operation === 'extract') {
            args.push('-vn', '-c:a', 'aac', '-b:a', '192k');
        } else if (operation === 'boost-shrink') {
            args.push(
                '-map', '0:a',
                '-map', '0:v?',
                '-map_metadata', '0',
                '-filter:a', `volume=${volumeMultiplier}`,
                '-c:a', 'aac',
                '-b:a', '256k',
                '-c:v', 'copy'
            );
        } else if (operation === 'mute') {
            args.push('-an', '-c:v', 'copy', '-map_metadata', '0');
        }
    }

    args.push(outputPath);
    return args;
};