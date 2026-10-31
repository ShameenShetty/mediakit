import { open } from '@tauri-apps/plugin-dialog'

export const selectVideoFile = async (): Promise<string | null> => {
    const selectedPath = await open({
        multiple: false,
        directory: false,
        filters: [
            {
                name: 'Video Files',
                extensions: ['mp4', 'mkv', 'mov', 'avi']
            },
            {
                name: 'All Files',
                extensions: ['*']
            }
        ]
    });

    if (selectedPath) {
        return selectedPath;
    } else {
        return null;
    }
}