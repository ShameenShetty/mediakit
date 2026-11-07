import {
    ActionIcon,
    Button,
    Center,
    Collapse,
    Divider,
    Group,
    Progress,
    Select,
    Slider,
    Stack,
    Text,
    Title,
    Tooltip
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowRight, IconHelp, IconSettings } from '@tabler/icons-react';
import { basename, dirname, extname, join } from '@tauri-apps/api/path';
import { exists } from '@tauri-apps/plugin-fs';
import { Command } from '@tauri-apps/plugin-shell';
import { useState } from 'react';
import { audioFormats, compressionPresets, encodingPresets, operations, videoFormats } from '../../constants/mediaOptions';
import { buildFfmpegArgs } from '../../services/ffmpegServices';
import { calculateEta } from '../../utils/calculateEta';
import { extractProgress } from '../../utils/extractProgress';
import { extractSpeed } from '../../utils/extractSpeed';
import { getDuration } from '../../utils/getDuration';
import { selectInputFile } from '../../utils/selectInputFile';

// TODO
// If I am encoding something, the switch over to another page, when I come back to the 
// original page, the home screen is reset even though the process is still running in the background.
// Maybe I can use Zustand to store the state of the process, or continue listening to the process
// in the background

export default function HomePage() {
    const [inputPath, setInputPath] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [fileExt, setFileExt] = useState<string>('');
    const [isAudioFile, setIsAudioFile] = useState<boolean>(false);

    const [operation, setOperation] = useState<string>('convert');
    const [outputFormat, setOutputFormat] = useState<string>('mp4');
    const [compressionMode, setCompressionMode] = useState<string>('balanced');

    // Advanced settings state
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [preset, setPreset] = useState<string>('medium');
    const [crf, setCrf] = useState<number>(23);

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

            if (operation === 'reencode' || operation === 'compress') {
                setOutputFormat(ext);
            } else {
                // Default convert target
                setOutputFormat(isAudio ? (ext === 'mp3' ? 'm4a' : 'mp3') : (ext === 'mp4' ? 'mkv' : 'mp4'));
            }
        }
    }

    async function handleRun() {
        if (!inputPath) {
            notifications.show({ title: 'Error', message: 'Please select an input file first.', color: 'red' });
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

            let endName = '';
            operation === 'reencode' ? endName = 'reencoded' : endName = operation + 'ed';

            let outputPath = await join(parentDir, `${baseName}_${endName}.${outputFormat}`);
            let existingFile = true;

            let count = 1;
            while (existingFile) {
                existingFile = await exists(outputPath)
                if (existingFile) outputPath = await join(parentDir, `${baseName}_${endName} (${count}).${outputFormat}`);
                count++;
            }

            let args: string[] = buildFfmpegArgs({
                inputPath,
                outputPath,
                operation,
                outputFormat,
                isAudioFile,
                compressionMode,
                preset,
                crf
            });

            console.log('Running operation:', { inputPath, operation, outputFormat, compressionMode, preset, crf });
            console.log('Executing FFmpeg with args:', args);

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
            <Center pb={10}><Title order={2}>MediaKit Workspace v11</Title></Center>

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
                    data={operations}
                    value={operation}
                    onChange={(val) => {
                        if (val) {
                            setOperation(val);
                            if ((val === 'reencode' || val === 'compress') && inputPath) {
                                setOutputFormat(fileExt);
                            } else if (val === 'convert' && inputPath) {
                                setOutputFormat(isAudioFile ? 'mp3' : 'mp4');
                            }
                        }
                    }}
                />

                <IconArrowRight size={22} style={{ marginBottom: 10 }} />

                {operation === 'compress' ? (
                    <Select
                        label="Compression Level"
                        w={180}
                        data={compressionPresets}
                        value={compressionMode}
                        onChange={(val) => val && setCompressionMode(val)}
                    />
                ) : (
                    <Select
                        key={isAudioFile ? 'audio-formats' : 'video-formats'}
                        label="Output Format"
                        w={180}
                        disabled={operation === 'reencode'}
                        data={isAudioFile ?
                            audioFormats.filter(f => f !== fileExt) :
                            videoFormats.filter(f => f !== fileExt)}
                        value={outputFormat}
                        onChange={(val) => val && setOutputFormat(val)}
                    />
                )}

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

            {/* Advanced Settings Collapse (Preset & CRF Slider) */}
            <Collapse expanded={showAdvanced}>
                <Stack p="md" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 8 }} gap="sm">
                    <Text size="sm" fw={600}>Advanced Encoding Options</Text>
                    <Group grow>
                        <Select
                            label="Preset"
                            data={encodingPresets}
                            value={preset}
                            onChange={(val) => val && setPreset(val)}
                        />
                        <Stack gap={4}>
                            <Group gap="xs" align="center">
                                <Text size="sm" fw={500}>CRF Quality: {crf}</Text>

                                <Tooltip
                                    label="CRF (Constant Rate Factor) controls quality for CPU encoding (range 0-51, where lower is better). A setting of 23-28 provides the ideal sweet spot between visual fidelity and file size."
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
                                max={51}
                                value={crf}
                                onChange={setCrf}
                                label={(val) => `${val} (Lower is better)`}
                            />
                        </Stack>
                    </Group>
                </Stack>
            </Collapse>

            <Divider my="sm" />

            {/* Action & Progress */}
            <Group>
                <Button
                    color="blue"
                    onClick={handleRun}
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