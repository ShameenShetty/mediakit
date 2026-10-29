import { open } from '@tauri-apps/plugin-dialog'

export const selectVideoFile = async (): Promise<string | null> => {
    const selectedPath = await open({
        multiple: false,      // Single file mode
        directory: false,     // Ensure it selects files, not folders
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