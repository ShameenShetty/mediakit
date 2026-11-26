import { Command } from '@tauri-apps/plugin-shell'

export const getVideoResolution = async (inputPath: string): Promise<string> => {
    console.log('Getting video resolution')

    const command = Command.sidecar('binaries/mediaProcessProbe', [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries',
        'stream=width,height',
        '-of', 'csv=s=x:p=0',
        inputPath
    ]);

    const output = await command.execute();

    if (output.code === 0) {
        const resolution = output.stdout;
        console.log(`Video resolution is ${resolution}s`);
        return resolution;
    } else {
        console.error('mediaProcessProbe failed with exit code:', output.code);
        return 'N/A';
    }
}