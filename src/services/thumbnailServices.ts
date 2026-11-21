export interface ThumbnailBuildArgsOptions {
    inputPath: string;
    outputPath: string;
    operation: 'get-thumbnail' | 'set-thumbnail';
    timestamp?: string; // For video extraction (e.g. '00:00:01')
    imagePath?: string; // For setting thumbnail/artwork
    isAudioFile: boolean;
}

export const buildThumbnailArgs = (options: ThumbnailBuildArgsOptions): string[] => {
    const { inputPath, outputPath, operation, timestamp = '00:00:01', imagePath, isAudioFile } = options;
    let args: string[] = [];

    if (operation === 'get-thumbnail') {
        if (isAudioFile) {
            // Extract embedded cover art from audio file (e.g. MP3 / M4A)
            args = [
                '-y',
                '-i', inputPath,
                '-an',                  // Drop audio stream
                '-vcodec', 'copy',      // Copy image stream directly
                outputPath
            ];
        } else {
            // Extract video frame at specific timestamp
            args = [
                '-y',
                '-ss', timestamp,
                '-i', inputPath,
                '-vframes', '1',        // Extract single frame
                outputPath
            ];
        }
    } else if (operation === 'set-thumbnail') {
        if (!imagePath) {
            throw new Error('An image path is required to set a thumbnail.');
        }

        if (isAudioFile) {
            const isMp3 = inputPath.toLowerCase().endsWith('.mp3');
            if (isMp3) {
                // Embed cover art into MP3 ID3 tags
                args = [
                    '-y',
                    '-i', inputPath,
                    '-i', imagePath,
                    '-map', '0:a',          // Map original audio stream
                    '-map', '1:v',          // Map image as album art stream
                    '-c:a', 'copy',         // Copy audio without re-encoding
                    '-id3v2_version', '3',
                    '-metadata:s:v', 'title="Album Cover"',
                    '-metadata:s:v', 'comment="Cover (Front)"',
                    outputPath
                ];
            } else {
                // Corrected attachment arguments for M4A/other audio formats
                args = [
                    '-y',
                    '-i', inputPath,
                    '-i', imagePath,
                    '-map', '0:a',
                    '-map', '1',
                    '-c', 'copy',
                    '-disposition:v:0', 'attached_pic',
                    outputPath
                ];
            }
        } else {
            // Set/Replace video cover/poster frame or attach thumbnail
            args = [
                '-y',
                '-i', inputPath,
                '-i', imagePath,
                '-map', '0',            // Map all original video/audio streams
                '-map', '1',            // Map image as attachment stream
                '-c', 'copy',
                '-disposition:v:1', 'attached_pic',
                outputPath
            ];
        }
    }

    return args;
};