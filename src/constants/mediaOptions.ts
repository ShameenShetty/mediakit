export const operations = [
    { label: 'Convert', value: 'convert' },
    { label: 'Re-Encode', value: 'reencode' },
    { label: 'Compress', value: 'compress' },
];

export const audioToolkitOperations = [
    { label: 'Extract', value: 'extract' },
    { label: 'Boost/Shrink', value: 'boost-shrink' },
    { label: 'Mute', value: 'mute' },
];

export const compressionPresets = [
    { label: 'Low Compression', value: 'low' },
    { label: 'Balanced', value: 'balanced' },
    { label: 'High Compression', value: 'high' },
];

export const encodingEffort = [
    { label: 'Fast (Quickest, Larger File)', value: 'veryfast' },
    { label: 'Balanced (Recommended)', value: 'medium' },
    { label: 'Thorough (Smaller File)', value: 'slow' },
    { label: 'Maximum Compression (Slowest)', value: 'veryslow' },
];

export const videoQualityOptions = [
    { label: 'Visually Lossless', value: '18' },
    { label: 'Balanced', value: '23' },
    { label: 'Compressed', value: '30' },
    { label: 'Maximum Compression', value: '40' },
];

export const upscaleQualityOptions = [
    { label: 'Maximum Quality (Sharper Details)', value: '85' },
    { label: 'Balanced (Recommended)', value: '50' },
    { label: 'Compressed', value: '35' },
    { label: 'Maximum Compression', value: '20' },
];

export const scaleOptions = [
    { label: '1080p Full HD', value: '1920:1080' },
    { label: '1440p QHD', value: '2560:1440' },
    { label: '4K UHD', value: '3840:2160' },
];

export type inputFileTypes = 'audio' | 'video' | 'image';
export const videoFormats = ['mp4', 'mkv', 'mov', 'webm'];
export const audioFormats = ['mp3', 'm4a', 'wav', 'opus'];
export const imageFormats = ['jpg', 'jpeg', 'avif', 'webp', 'png'];