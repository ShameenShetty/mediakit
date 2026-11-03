import { Button, Center, FileInput, Stack, Text, Title } from '@mantine/core';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';

export default function SettingsPage() {

    const [encoder, setEncoder] = useState('');

    return (
        <Stack p="lg" gap="md">
            <Center><Title order={2}>Settings</Title></Center>

            <FileInput
                label="Default Path" placeholder="Select default path for saving files"
                onClick={async () => {
                    const dirPath = await open({
                        directory: true,
                        multiple: false,
                        title: 'Select Default Path'
                    });

                    if (!dirPath) {
                        console.log('No directory selected');
                    }

                    console.log('Switching to default path - ', dirPath)
                }}
            />
            <Text>Default Path: /Users/planeswalker/Downloads</Text>

            <Button
                onClick={async () => {
                    await invoke('select_best_encoder').
                        then((gpuInfo) => setEncoder('' + gpuInfo)).
                        catch((err) => console.error('Error getting GPU info: ', err));
                }}
            >
                Get Best Info
            </Button>

            <p>Best Encoder: {encoder}</p>
        </Stack>
    )
}