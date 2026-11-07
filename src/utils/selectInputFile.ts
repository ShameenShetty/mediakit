import { open } from '@tauri-apps/plugin-dialog';
import { videoFormats, audioFormats } from '../constants/mediaOptions'

export type MediaType = 'video' | 'audio' | 'both';

/**
 * Opens a native file dialog to select a media file.
 * @param mediaType - Restricts selection to 'video', 'audio', or 'both' (default: 'both')
 */
export const selectInputFile = async (mediaType: MediaType = 'both'): Promise<string | null> => {
    const filters = [];

    if (mediaType === 'video' || mediaType === 'both') {
        filters.push({
            name: 'Video Files',
            extensions: videoFormats
        });
    }

    if (mediaType === 'audio' || mediaType === 'both') {
        filters.push({
            name: 'Audio Files',
            extensions: audioFormats
        });
    }

    // Optional: Add a combined "All Media" filter if 'both' is selected
    if (mediaType === 'both') {
        filters.push({
            name: 'All Media',
            extensions: [...videoFormats, ...audioFormats]
        });
    }

    return await open({
        multiple: false,
        directory: false,
        filters
    });
};