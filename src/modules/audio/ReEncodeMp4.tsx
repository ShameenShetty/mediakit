import { Button, Select, Stack, Title } from '@mantine/core';
import { selectVideoFile } from '../../utils/selectVideoFile';
import { notifications } from '@mantine/notifications';
import { Command } from '@tauri-apps/plugin-shell'
import { dirname, basename, extname, join } from '@tauri-apps/api/path';
import { getDuration } from '../../utils/getDuration';
import { useState } from 'react';

const modes = [
    { label: 'Lower Quality (fast)', value: 'lower' },
    { label: 'Balanced (medium)', value: 'balanced' },
    { label: 'High Quality (slow)', value: 'high' }
] as const;

type ModeValue = typeof modes[number]['value'];

export default function ReEncodeMp4() {

    const [mode, setMode] = useState<ModeValue>('balanced');

    async function reEncodeVideo() {
        // TODO later we can add a way to select a directory and re-encode all the videos in that dir
        // maybe we can filter the videos as well like only mp4 files.
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
        let preset = "veryfast";
        let crf = "23";

        if (mode === 'lower') {
            preset = "veryfast"
            crf = "23"
        } else if (mode === 'balanced') {
            preset = "medium"
            crf = "20"
        } else if (mode === 'high') {
            preset = "medium"
            crf = "20"
        }
        console.log('Re-encoding at mode ', mode);

        // Extract path details using Tauri's official path API
        const parentDir = await dirname(inputPath);
        const fileName = await basename(inputPath);
        const fileFormat = await extname(inputPath); // e.g. "mp4"

        // Remove the extension from the filename to build the re-encoded name
        const baseName = fileName.slice(0, -(fileFormat.length + 1));

        // Construct the output path dynamically: ${name}_reencoded${ext}
        const outputPath = await join(parentDir, `${baseName}_reencoded.${fileFormat}`);

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

            <Button w={150} onClick={() => getDuration('')}>Get Duration</Button>

            <Select
                w={200} label='Choose mode'
                data={modes}
                value={mode}
                onChange={(value) => setMode(value || 'balanced')}
            />
        </Stack>
    );
}