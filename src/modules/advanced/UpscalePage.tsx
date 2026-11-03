import { ActionIcon, Alert, Button, Center, Collapse, Divider, Group, Progress, Select, Slider, Stack, Text, Title, Tooltip } from '@mantine/core';
import { IconAlertTriangle, IconArrowRight, IconHelp, IconSettings } from '@tabler/icons-react';
import { invoke } from '@tauri-apps/api/core';
import { basename, dirname, extname } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';
import { Command } from '@tauri-apps/plugin-shell';
import { useEffect, useState } from 'react';
import { scaleOptions, videoFormats } from '../../constants/mediaOptions';
import { buildUpscaleArgs } from '../../services/upscaleServices';
import { notifications } from '@mantine/notifications';
import { calculateEta } from '../../utils/calculateEta';
import { extractProgress } from '../../utils/extractProgress';
import { extractSpeed } from '../../utils/extractSpeed';
import { getDuration } from '../../utils/getDuration';

export function UpscalePage() {

    const [inputPath, setInputPath] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [fileExt, setFileExt] = useState<string>('');
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [scale, setScale] = useState<typeof scaleOptions[number]['value']>('2560:1440');
    const [qv, setQv] = useState<number>(50);
    const [encoder, setEncoder] = useState<string | null>(null);

    const [progress, setProgress] = useState<number>(0);
    const [_, setSpeed] = useState<number>(0);
    const [eta, setEta] = useState<string>('N/A');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    useEffect(() => {
        const getBestEncoder = async () => {
            const encoder = await invoke<string>('select_best_encoder').
                catch((err) => console.error('Error getting GPU info: ', err));

            console.log('Best GPU encoder is - ', encoder)
            setEncoder(encoder || '');
        }

        getBestEncoder();
    }, []);

    const handleSelectFile = async () => {
        const inputPath = await open({
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

        if (!inputPath) {
            console.log('No file selected');
            return;
        }

        setInputPath(inputPath);
        setFileName(await basename(inputPath));
        setFileExt(await extname(inputPath));
    }

    async function handleUpscale() {
        if (!inputPath) {
            notifications.show({ title: 'Error', message: 'Please select an video file first.', color: 'red' });
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

            const outputPath = `${parentDir}/${baseName}_upscaled.${fileExt}`;

            console.log('Output path - ', outputPath)

            let args: string[] = buildUpscaleArgs({
                inputPath: inputPath,
                outputPath: outputPath,
                scale: scale || '',
                qv: qv.toString(),
                gpuEncoder: encoder || 'libx265',
            })

            console.log('Built upscale arguments - ', args)

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
                        console.log('extractedSpeed - ', extractedSpeed, ' ETA: ', calculatedEta)
                    }
                }
            });

            command.on('close', (data) => {
                setIsProcessing(false);
                if (data.code === 0) {
                    setProgress(100);
                    setSpeed(0);
                    setEta('0h 0m 0s');
                    notifications.show({ title: 'Success', message: 'Operation completed successfully!', color: 'green' });
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
            <Center><Title order={2}>Hardware Upscale Video</Title></Center>

            <Group align="flex-end" gap="md">
                <Button variant="default" onClick={handleSelectFile} w={200}>
                    {fileName ? fileName : 'Choose video file...'}
                </Button>

                <IconArrowRight size={22} style={{ marginBottom: 10 }} />

                {/* Scale select */}
                <Select
                    label='Scale' placeholder='Choose resolution'
                    w={170} data={scaleOptions}
                    value={scale}
                    onChange={(val) => {
                        if (!val) {
                            setScale(val as typeof scale);
                        }
                    }}
                />

                <IconArrowRight size={22} style={{ marginBottom: 10 }} />

                {/* Upscale button */}
                <Button onClick={handleUpscale}>Upscale</Button>

                <Tooltip label="Show advanced options">
                    <ActionIcon
                        variant={showAdvanced ? 'filled' : 'default'}
                        size={36}
                        onClick={() => setShowAdvanced((prev) => !prev)}
                        style={{ marginBottom: 2 }}
                    >
                        <IconSettings size={20} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            {encoder === 'libx265' && (
                <Alert
                    variant="light"
                    color="red"
                    title="Software Encoding Fallback"
                    icon={<IconAlertTriangle size={18} />}
                >
                    No supported hardware encoder (NVIDIA, AMD, Intel, or Apple Silicon) was detected. Falling back to CPU encoding (libx265), which will be significantly slower.
                </Alert>
            )}

            <Collapse expanded={showAdvanced}>
                <Stack p="md" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }} gap="sm">
                    <Text size="sm" fw={600}>Advanced Upscaling Options</Text>

                    <Stack gap={4}>
                        <Group gap="xs" align="center">
                            <Text size="sm" fw={500}>QV Quality:</Text>

                            <Tooltip
                                label="QV (-q:v) controls hardware encoding quality for Apple VideoToolbox (range 1–100, higher is better). Default (50) offers the best balance between 4K upscale details and manageable file sizes."
                                multiline
                                w={260}
                                withArrow
                            >
                                <IconHelp
                                    size={16}
                                    style={{ cursor: 'help', color: 'var(--mantine-color-dimmed)' }}
                                />
                            </Tooltip>
                        </Group>
                        <Slider
                            min={0}
                            max={100}
                            value={qv}
                            onChange={setQv}
                            label={(val) => `${val} (Higher is better)`}
                        />
                    </Stack>
                </Stack>
            </Collapse>

            <Divider my="sm" />
            <Text size="sm" c={progress === 100 ? 'blue' : 'gray'}>
                {progress === 100 ? 'Completed' : `Progress: ${progress.toFixed(2)}% ETA: ${eta}`}
            </Text>
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