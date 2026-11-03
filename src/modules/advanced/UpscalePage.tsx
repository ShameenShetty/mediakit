import { ActionIcon, Button, Center, Collapse, FileInput, Group, Select, Slider, Stack, Text, Title, Tooltip } from '@mantine/core';
import { IconArrowRight, IconHelp, IconSettings } from '@tabler/icons-react';
import { open } from '@tauri-apps/plugin-dialog';
import { useEffect, useState } from 'react';
import { scaleOptions, videoFormats } from '../../constants/mediaOptions';
import { buildUpscaleArgs } from '../../services/upscaleServices';
import { invoke } from '@tauri-apps/api/core';

export function UpscalePage() {

    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [scale, setScale] = useState<string | null>(null);
    const [qv, setQv] = useState<number>(50);
    const [encoder, setEncoder] = useState<string | null>(null);

    useEffect(() => {
        const getBestEncoder = async () => {
            const encoder = await invoke<string>('select_best_encoder').
                catch((err) => console.error('Error getting GPU info: ', err));

            console.log('Best GPU encoder is - ', encoder)
            setEncoder(encoder || '');
        }

        getBestEncoder();
    }, []);

    return (
        <Stack p="lg" gap="md">
            <Center><Title order={2}>Upscale Video</Title></Center>

            <Group align='flex-end'>
                <FileInput
                    w={250} label='Video File' placeholder='Select a video file to upscale'
                    onClick={async () => {
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

                        console.log('Upscaling video file at path - ', inputPath)
                        console.log('Scale chosen is - ', scale)



                        console.log('Selected GPU encoder is - ', encoder)
                        const args = buildUpscaleArgs({
                            inputPath: inputPath,
                            outputPath: '',
                            scale: scale || '',
                            qv: '',
                            gpuEncoder: encoder || 'libx265',
                        })

                        console.log('Built upscale arguments - ', args)
                    }}
                />

                <IconArrowRight size={22} style={{ marginBottom: 10 }} />

                <Select
                    label='Scale' placeholder='Choose resolution'
                    w={170} data={scaleOptions}
                    value={scale}
                    onChange={(val) => setScale(val)}
                />

                <IconArrowRight size={22} style={{ marginBottom: 10 }} />

                <Button>Upscale</Button>

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
        </Stack>
    );
}