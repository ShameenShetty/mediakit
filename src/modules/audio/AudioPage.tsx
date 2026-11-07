import { Button, Center, Divider, Group, NumberInput, Progress, Select, Stack, Text, Title, Tooltip } from '@mantine/core';
import { IconArrowRight, IconHelp } from '@tabler/icons-react';
import { useState } from 'react';
import { audioFormats, audioToolkitOperations } from '../../constants/mediaOptions';
import { selectInputFile } from '../../utils/selectInputFile';
import { basename, dirname, extname } from '@tauri-apps/api/path';
import { buildAudioArgs } from '../../services/audioToolkitServices';
import { Command } from '@tauri-apps/plugin-shell';
import { notifications } from '@mantine/notifications';
import { calculateEta } from '../../utils/calculateEta';
import { extractProgress } from '../../utils/extractProgress';
import { extractSpeed } from '../../utils/extractSpeed';
import { getDuration } from '../../utils/getDuration';

export function AudioPage() {
    const [inputPath, setInputPath] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [fileExt, setFileExt] = useState<string>('');
    const [operation, setOperation] = useState<typeof audioToolkitOperations[number]['value']>('extract');
    const [volumeMultiplier, setVolumeMultiplier] = useState<number | ''>(1.0);
    const [isAudioFile, setIsAudioFile] = useState<boolean>(false);

    const [progress, setProgress] = useState<number>(0);
    const [_, setSpeed] = useState<number>(0);
    const [eta, setEta] = useState<string>('N/A');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    async function handleSelectFile() {
        const selected = await selectInputFile('both');

        if (selected && typeof selected === 'string') {
            setInputPath(selected);
            const name = await basename(selected);
            const ext = (await extname(selected)).toLowerCase();

            setFileName(name);
            setFileExt(ext);
            const isAudio = audioFormats.includes(ext);
            setIsAudioFile(isAudio);

            // Reset operation to a safe default if the current operation is invalid for the new file type
            if (isAudio) {
                setOperation('boost-shrink'); // Audio only supports boost-shrink now
            } else {
                setOperation('extract'); // Default for video files
            }
        }
    }

    async function handleAudioOperation() {
        if (!inputPath) {
            notifications.show({ title: 'Error', message: 'Please select a video file first.', color: 'red' });
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setSpeed(0);
        setEta('Calculating...');

        try {
            const duration = await getDuration(inputPath);
            const parentDir = await dirname(inputPath);
            const baseName = fileName.slice(0, -(fileExt.length + 1));

            // Determine output suffix and container based on operation
            let suffix = 'processed';
            let targetExt = fileExt;

            if (operation === 'extract') {
                suffix = 'extracted';
                targetExt = 'm4a'; // Extract audio into standard m4a container
            } else if (operation === 'boost-shrink') {
                suffix = 'volume';
            } else if (operation === 'mute') {
                suffix = 'muted';
            }

            const outputPath = `${parentDir}/${baseName}_${suffix}.${targetExt}`;
            console.log('Output path - ', outputPath);

            const args = buildAudioArgs({
                inputPath: inputPath,
                outputPath: outputPath,
                operation: operation as 'extract' | 'boost-shrink' | 'mute',
                volumeMultiplier: volumeMultiplier === '' ? 1.0 : volumeMultiplier,
                isAudioFile: isAudioFile,
            });

            console.log('Built audio arguments - ', args);

            const command = Command.sidecar('binaries/ffmpeg', args);

            command.stderr.on('data', (line) => {
                console.log('FFmpeg stderr:', line);
                if (line.includes('time=')) {
                    const p = extractProgress(duration, line) || 0;
                    setProgress(p);

                    if (line.includes('speed=')) {
                        const extractedSpeed = extractSpeed(line) || 0;
                        setSpeed(extractedSpeed);

                        const calculatedEta = calculateEta(p, extractedSpeed, duration);
                        setEta(calculatedEta);
                        console.log('extractedSpeed - ', extractedSpeed, ' ETA: ', calculatedEta);
                    }
                }
            });

            command.on('close', (data) => {
                setIsProcessing(false);
                if (data.code === 0) {
                    setProgress(100);
                    setSpeed(0);
                    setEta('0h 0m 0s');
                    notifications.show({ title: 'Success', message: 'Audio operation completed successfully!', color: 'green' });
                } else {
                    notifications.show({ title: 'Error', message: `Process failed with code ${data.code}`, color: 'red' });
                }
            });

            await command.spawn();

        } catch (err) {
            setIsProcessing(false);
            notifications.show({ title: 'Error', message: String(err), color: 'red' });
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
                    data={isAudioFile ? audioToolkitOperations
                        .filter(op => op.value === 'boost-shrink') : audioToolkitOperations}
                    value={operation}
                    onChange={(val) => val && setOperation(val as any)}
                />

                {operation === 'boost-shrink' && <>
                    <IconArrowRight size={22} style={{ marginBottom: 10 }} />

                    <NumberInput
                        label={
                            <Tooltip
                                label="Enter a multiplier to adjust volume: values > 1 boost audio (e.g., 2 or 2.5), fractions between 0 and 1 reduce audio (e.g., 0.5 to halve)."
                                multiline
                                w={260}
                                withArrow
                            >
                                <Group gap='xs'>
                                    <Text>Adjust Audio</Text>
                                    <IconHelp
                                        size={16}
                                        style={{ cursor: 'help', color: 'var(--mantine-color-dimmed)' }}
                                    />
                                </Group>
                            </Tooltip>
                        }
                        decimalScale={1}
                        max={5}
                        min={0}
                        value={volumeMultiplier}
                        onChange={(val) => setVolumeMultiplier(val as number | '')}
                    />
                </>}
            </Group>

            <Divider my="sm" />

            {/* Action & Progress */}
            <Group>
                <Button
                    color="blue"
                    onClick={handleAudioOperation}
                    disabled={!inputPath || isProcessing}
                >
                    {isProcessing ? 'Processing...' : 'Run Operation'}
                </Button>
                <Text size="sm" c={progress === 100 ? 'blue' : 'gray'}>
                    {progress === 100 ? 'Completed' : `Progress: ${progress.toFixed(2)}% ETA: ${eta}`}
                </Text>
            </Group>

            {progress > 0 && (
                <Progress
                    h={16}
                    value={progress}
                    striped
                    animated={isProcessing}
                    color={progress === 100 ? 'green' : 'blue'}
                />
            )}
        </Stack>
    );
}