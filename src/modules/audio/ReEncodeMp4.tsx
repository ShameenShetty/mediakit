import { Button, Stack, Title } from '@mantine/core';
import { selectVideoFile } from '../../utils/selectVideoFile';
import { notifications } from '@mantine/notifications';

export default function ReEncodeMp4() {
    async function reEncodeVideo() {
        const inputPath = await selectVideoFile();

        if (!inputPath) {
            console.log('Must select a path')
            notifications.show({
                title: 'Error',
                message: 'Must select a file',
                color: 'red',
            })
            return;
        }


    }

    return (
        <Stack p='sm'>
            <Title>ReEncode MP4</Title>
            <Button w={150} onClick={reEncodeVideo}>Choose mp4 file</Button>
        </Stack>
    );
}