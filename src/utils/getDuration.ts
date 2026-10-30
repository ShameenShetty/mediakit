import { Command } from '@tauri-apps/plugin-shell'

export const getDuration = (inputPath: string) => {
    console.log('Getting duration from video')
    const command = Command.sidecar('binaries/ffprobe', [
        '-v', 'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        inputPath
    ]);

    let duration = 0;
    command.stdout.on('data', (line) => {
        duration = Number(line || -1);
        console.log(`Duration of video is ${duration}s`)
    });

    command.spawn();

    command.on('close', (line) => {
        if (line.code === 0) return duration;
        else return -1
    })
}