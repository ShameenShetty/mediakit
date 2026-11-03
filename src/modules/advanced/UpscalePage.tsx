import { Button, Center, FileInput, Group, Stack, Title } from '@mantine/core';
import { open } from '@tauri-apps/plugin-dialog';
import { videoFormats } from '../../constants/mediaOptions';

export function UpscalePage() {
    return (
        <Stack p="lg" gap="md">
            <Center><Title order={2}>Upscale Video</Title></Center>

            <Group align='flex-end'>
                <FileInput
                    w={250} label='Video File' placeholder='Select a video file to upscale'
                    onClick={async () => {
                        const dirPath = await open({
                            directory: false,
                            multiple: false,
                            title: 'Select Input Video File',
                            filters: [
                                {
                                    name: 'Video',
                                    extensions: videoFormats
                                }
                            ]
                        });

                        if (!dirPath) {
                            console.log('No directory selected');
                        }

                        console.log('Switching to default path - ', dirPath)
                    }}
                />

                <Button>Upscale</Button>
            </Group>
        </Stack>
    );
}