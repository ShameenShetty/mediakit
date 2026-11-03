import { Center, FileInput, Stack, Text, Title } from '@mantine/core';
import { open } from '@tauri-apps/plugin-dialog';

export default function SettingsPage() {
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
        </Stack>
    )
}