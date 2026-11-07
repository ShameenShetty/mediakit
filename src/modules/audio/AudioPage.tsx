import { Button, Center, Group, Select, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useState } from 'react';
import { audioToolkitOperations } from '../../constants/mediaOptions';
import { selectInputFile } from '../../utils/selectInputFile';

export function AudioPage() {
    const [fileName, _] = useState<string>('');
    const [operation, setOperation] = useState<string>('extract');

    async function handleSelectFile() {
        const selected = await selectInputFile('both');

        // TODO IMPORTANT
        // Based on the operation if there is an already existing file, e.g. "input_webm_reencoded.webm"
        // then we should prompt the user whether they want to overwrite that file or create a new one.
        // Currently, it will do nothing and just fail silently, which is not a good user experience.
        // TODO another bug related to the above
        // If I try reencoding a video and it will have the same output name as an existing file, then we get
        // an infinite loop of "Calculating..." ETA and nothing happens.
        if (selected && typeof selected === 'string') {
            // setInputPath(selected);
            // const name = await basename(selected);
            // const ext = (await extname(selected)).toLowerCase();

            // setFileName(name);
            // setFileExt(ext);

            // const isAudio = audioFormats.includes(ext);
            // setIsAudioFile(isAudio);

            // if (operation === 'reencode' || operation === 'compress') {
            //     setOutputFormat(ext);
            // } else {
            //     // Default convert target
            //     setOutputFormat(isAudio ? (ext === 'mp3' ? 'm4a' : 'mp3') : (ext === 'mp4' ? 'mkv' : 'mp4'));
            // }
        }
    }

    return (
        <Stack p="lg" gap="md">
            <Center><Title order={2}>Audio Toolkit</Title></Center>

            {/* 3-Step Pipeline Flow */}
            <Group align="flex-end" gap="md">
                <Stack gap={4}>
                    <Text size="sm" fw={500}>Input File</Text>
                    <Button variant="default" onClick={handleSelectFile} w={200}>
                        {fileName ? fileName : 'Choose file...'}
                    </Button>
                </Stack>

                <IconArrowRight size={22} style={{ marginBottom: 10 }} />

                <Select
                    label="Operation"
                    w={140}
                    data={audioToolkitOperations}
                    value={operation}
                    onChange={(val) => {
                        if (val) {
                            setOperation(val);
                        }
                    }}
                />

                <IconArrowRight size={22} style={{ marginBottom: 10 }} />
            </Group>
        </Stack>
    );
}