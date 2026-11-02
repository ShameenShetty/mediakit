import { useState } from 'react';
import {
    Stack,
    Title,
    Group,
    Button,
    Select,
    Progress,
    ActionIcon,
    Tooltip,
    Collapse,
    Slider,
    Text,
    Divider
} from '@mantine/core';
import { IconArrowRight, IconSettings } from '@tabler/icons-react';
import { open } from '@tauri-apps/plugin-dialog';
import { dirname, basename, extname, join } from '@tauri-apps/api/path';
import { Command } from '@tauri-apps/plugin-shell';
import { notifications } from '@mantine/notifications';
import { getDuration } from '../../utils/getDuration';
import { extractProgress } from '../../utils/extractProgress';

const operations = [
    { label: 'Convert', value: 'convert' },
    { label: 'Re-Encode', value: 'reencode' },
    { label: 'Compress', value: 'compress' },
];

const compressionPresets = [
    { label: 'Low Compression', value: 'low' },
    { label: 'Balanced', value: 'balanced' },
    { label: 'High Compression', value: 'high' },
];

const encodingPresets = [
    { label: 'Very Fast', value: 'veryfast' },
    { label: 'Fast', value: 'fast' },
    { label: 'Medium', value: 'medium' },
    { label: 'Slow', value: 'slow' },
];

const videoFormats = ['mp4', 'mkv', 'mov', 'webm'];
const audioFormats = ['mp3', 'm4a', 'wav', 'opus'];

export default function Home() {
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
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    async function handleSelectFile() {
        const selected = await open({
            multiple: false,
            directory: false,
        });

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

        try {
            const duration = await getDuration(inputPath);
            const parentDir = await dirname(inputPath);
            const baseName = fileName.slice(0, -(fileExt.length + 1));
            const outputPath = await join(parentDir, `${baseName}_mediaKit.${outputFormat}`);

            let args: string[] = ['-i', inputPath];

            if (isAudioFile) {
                args.push('-vn');
            }

            if (operation === 'compress') {
                // Compression preset mappings
                let targetCrf = '26';
                let targetPreset = 'fast';
                if (compressionMode === 'low') { targetCrf = '21'; targetPreset = 'medium'; }
                if (compressionMode === 'high') { targetCrf = '30'; targetPreset = 'veryfast'; }

                if (isAudioFile) {
                    args.push('-c:a', 'libmp3lame', '-b:a', compressionMode === 'high' ? '96k' : '128k');
                } else {
                    args.push('-c:v', 'libx264', '-preset', targetPreset, '-crf', targetCrf, '-c:a', 'aac', '-b:a', '128k');
                }
            } else if (operation === 'reencode') {
                if (isAudioFile) {
                    args.push('-c:a', 'aac', '-b:a', '192k');
                } else {
                    args.push('-c:v', 'libx264', '-preset', preset, '-crf', crf.toString(), '-c:a', 'aac');
                }
            } else {
                if (isAudioFile) {
                    if (outputFormat === 'mp3') {
                        args.push('-c:a', 'libmp3lame', '-b:a', '192k');
                    } else if (outputFormat === 'm4a') {
                        args.push('-c:a', 'aac', '-b:a', '192k');
                    } else if (outputFormat === 'opus') {
                        args.push('-c:a', 'libopus', '-b:a', '128k');
                    } else if (outputFormat === 'wav') {
                        // Force uncompressed standard PCM 16-bit stereo for clean WAV playback
                        args.push('-c:a', 'pcm_s16le');
                    } else {
                        args.push('-c:a', 'aac');
                    }
                } else {
                    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac');
                }
            }

            args.push(outputPath);

            const command = Command.sidecar('binaries/ffmpeg', args);

            command.stderr.on('data', (line) => {
                if (line.includes('time=')) {
                    const p = extractProgress(duration, line) || 0;
                    setProgress(p);
                }
            });

            command.on('close', (data) => {
                setIsProcessing(false);
                if (data.code === 0) {
                    setProgress(100);
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
            <Title order={2}>MediaKit Workspace</Title>

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
                            <Text size="sm" fw={500}>CRF Quality: {crf}</Text>
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