import { Command } from '@tauri-apps/plugin-shell'

export const getDuration = async (inputPath: string): Promise<number> => {
    console.log('Getting duration from video')

    const command = Command.sidecar('binaries/mediaProcessProbe', [
        '-v', 'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        inputPath
    ]);

    const output = await command.execute();

    if (output.code === 0) {
        const duration = Number(output.stdout.trim());
        console.log(`Duration of video is ${duration}s`);
        return isNaN(duration) ? -1 : duration;
    } else {
        console.error('mediaProcessProbe failed with exit code:', output.code);
        return -1;
    }
}