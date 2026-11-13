import { open } from '@tauri-apps/plugin-dialog';
import { videoFormats, audioFormats, imageFormats } from '../constants/mediaOptions';

export type MediaType = 'video' | 'audio' | 'image' | 'all';

interface InputFileProps {
    mediaType?: MediaType[];
    selectMultiple?: boolean;
    selectDirectory?: boolean;
}

/**
 * Opens a native file dialog to select a media file or files.
 * 
 * @param mediaType - Array of allowed media types (e.g., ['audio', 'video'], default: ['all'])
 */
export const selectInputFile = async ({
    mediaType = ['all'],
    selectMultiple = false,
    selectDirectory = false
}: InputFileProps = {}): Promise<string | string[] | null> => {

    if (mediaType.includes('all')) {
        return await open({
            multiple: selectMultiple,
            directory: selectDirectory,
            filters: [
                {
                    name: 'All Media',
                    extensions: [...videoFormats, ...audioFormats, ...imageFormats]
                }
            ]
        });
    }

    const filters = [];

    if (mediaType.includes('video')) {
        filters.push({
            name: 'Video Files',
            extensions: videoFormats
        });
    }

    if (mediaType.includes('audio')) {
        filters.push({
            name: 'Audio Files',
            extensions: audioFormats
        });
    }

    if (mediaType.includes('image')) {
        filters.push({
            name: 'Image Files',
            extensions: imageFormats
        });
    }

    return await open({
        multiple: selectMultiple,
        directory: selectDirectory,
        filters
    });
};