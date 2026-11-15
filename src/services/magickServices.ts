import { inputFileTypes } from '../constants/mediaOptions';

export interface BuildMagickArgsOptions {
    inputPath: string;
    outputPath: string;
    operation: string;
    outputFormat: string;
    fileType: inputFileTypes;
    compressionMode: string;
    quality: number;
}

export const buildMagickArgs = (options: BuildMagickArgsOptions): string[] => {
    const { inputPath, outputPath, operation, outputFormat, compressionMode, quality } = options;

    // ImageMagick CLI structure begins with the input path
    let args: string[] = [inputPath];

    // --------------------------------------------------------
    // Conversion & Re-encode branch
    // --------------------------------------------------------
    if (operation === 'convert') {
        // Map quality (0 to 51 scale or standard percentage) to ImageMagick quality (-quality 0-100)
        // ImageMagick quality: 100 is best, 0 is worst (inverse of CRF)
        const imQuality = Math.max(1, Math.min(100, Math.round(100 - (quality / 51) * 100)));

        args.push('-quality', imQuality.toString());

        // Format-specific flags if needed
        if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
            args.push('-sampling-factor', '4:2:0', '-strip'); // Standard web optimization
        } else if (outputFormat === 'png') {
            // ImageMagick PNG compression level (0-9)
            args.push('-define', 'png:compression-level=6');
        } else if (outputFormat === 'webp') {
            args.push('-define', `webp:lossless=${imQuality === 100 ? 'true' : 'false'}`);
        }
    }

    // --------------------------------------------------------
    // Compression branch (Driven by Compression Mode)
    // --------------------------------------------------------
    else if (operation === 'compress') {
        if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
            let jpgQuality = '80'; // medium default
            if (compressionMode === 'low') jpgQuality = '90';
            if (compressionMode === 'high') jpgQuality = '60';
            args.push('-quality', jpgQuality, '-interlace', 'Plane');
        } else if (outputFormat === 'png') {
            // Force maximum zlib compression and adaptive filtering for PNGs to ensure smaller file size
            args.push(
                '-define', 'png:compression-level=9',
                '-define', 'png:compression-filter=5',
                '-define', 'png:compression-strategy=1',
                '-define', 'png:exclude-chunk=all' // Strips all extra chunks (tEXt, zTXt, iTXt) to minimize size
            );
        } else if (outputFormat === 'webp' || outputFormat === 'avif') {
            let webpQuality = '75';
            if (compressionMode === 'low') webpQuality = '85';
            if (compressionMode === 'high') webpQuality = '50';
            args.push('-quality', webpQuality);
        } else {
            args.push('-quality', '75');
        }
    } else {
        throw new Error(`Unsupported image operation: ${operation}`);
    }

    // ImageMagick expects the final argument to be the output path
    args.push(outputPath);
    return args;
};