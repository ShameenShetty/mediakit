import { Button, Stack, Title } from '@mantine/core';
import { selectVideoFile } from '../../utils/selectVideoFile';
import { notifications } from '@mantine/notifications';
import { Command } from '@tauri-apps/plugin-shell'
import { dirname, basename, extname, join } from '@tauri-apps/api/path';

export default function ReEncodeMp4() {
    async function reEncodeVideo() {
        const inputPath = await selectVideoFile();

        if (!inputPath) {
            console.log('Must select a path');
            notifications.show({
                title: 'Error',
                message: 'Must select a file',
                color: 'red',
            });
            return;
        }

        // Define the mode parameters
        // TODO use a slider for CRF that goes from 0 to 100
        // and use a dropdown for the preset
        // Or we can also have options like 'Lower Quality (fast)', 'Balanced (medium)', 'High Quality (slow)'
        const preset = "veryfast";
        const crf = "23";

        // Extract path details using Tauri's official path API
        const parentDir = await dirname(inputPath);
        const fileName = await basename(inputPath);
        const fileFormat = await extname(inputPath); // e.g. "mp4"

        // Remove the extension from the filename to build the re-encoded name
        const baseName = fileName.slice(0, -(fileFormat.length + 1));

        // Construct the output path dynamically: ${name}_reencoded${ext}
        const outputPath = await join(parentDir, `${baseName}_reencoded.${fileFormat}`);

        console.log('parent - ', parentDir, ', file - ', fileName, ', fileFormat - ', fileFormat);
        console.log('output - ', outputPath);

        // Setup the FFmpeg sidecar command
        const command = Command.sidecar('binaries/ffmpeg', [
            '-i', inputPath,
            '-c:v', 'libx264',
            '-preset', preset,
            '-crf', crf,
            '-c:a', 'aac',
            '-b:a', '180k',
            '-movflags', '+faststart',
            outputPath
        ]);

        // Optional: Log output / handle events if spawning
        command.stdout.on('data', (line) => console.log('stdout - ', line));
        command.stderr.on('data', (line) => console.log('stderr - ', line));
        
        command.on('close', (data) => {
            console.log('Close - ', data);

            // Code 0 means success
            if (data.code === 0) {
                notifications.show({
                    title: 'Success',
                    message: 'Video re-encoded successfully!',
                    color: 'green',
                });
            } else {
                notifications.show({
                    title: 'Error',
                    message: `Re-encoding failed with exit code ${data.code}`,
                    color: 'red',
                });
            }
        });

        await command.spawn();
    }

    return (
        <Stack p='sm'>
            <Title>ReEncode MP4</Title>
            <Button w={150} onClick={reEncodeVideo}>Choose mp4 file</Button>
        </Stack>
    );
}