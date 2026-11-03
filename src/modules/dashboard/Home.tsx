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
import { audioFormats, operations, compressionPresets, videoFormats, encodingPresets } from '../../constants/mediaOptions';
import { calculateEta } from '../../utils/calculateEta';
import { extractSpeed } from '../../utils/extractSpeed';

// TODO IMPORTANT
// If a file already exists with the same name, we should prompt the user to either overwrite or rename the output file. Currently, it will do nothing and just fail silently, which is not a good user experience.

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
    const [_, setSpeed] = useState<number>(0);
    const [eta, setEta] = useState<string>('N/A');
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
        console.log('Running operation:', { inputPath, operation, outputFormat, compressionMode, preset, crf });

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
            const outputPath = await join(parentDir, `${baseName}_${endName}.${outputFormat}`);

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
                    // Video compression branch with WebM/VP9 support
                    if (outputFormat === 'webm') {
                        let cpuUsed = '3'; // default / fast equivalent for compression
                        if (targetPreset === 'veryfast') cpuUsed = '4';
                        else if (targetPreset === 'fast') cpuUsed = '3';
                        else if (targetPreset === 'medium') cpuUsed = '2';
                        else if (targetPreset === 'slow') cpuUsed = '0';

                        args.push(
                            '-c:v', 'libvpx-vp9',
                            '-crf', targetCrf,
                            '-b:v', '0',
                            '-cpu-used', cpuUsed,
                            '-row-mt', '1',
                            '-c:a', 'libopus',
                            '-b:a', '128k'
                        );
                    } else {
                        args.push('-c:v', 'libx264', '-preset', targetPreset, '-crf', targetCrf, '-c:a', 'aac', '-b:a', '128k');
                    }
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
                    // Video conversion branch
                    if (outputFormat === 'webm') {
                        // Map H.264 presets to VP9 -cpu-used values (0 to 5)
                        let cpuUsed = '2'; // default / medium equivalent
                        if (preset === 'veryfast') cpuUsed = '4';
                        else if (preset === 'fast') cpuUsed = '3';
                        else if (preset === 'medium') cpuUsed = '2';
                        else if (preset === 'slow') cpuUsed = '0'; // slow takes maximum CPU for best compression

                        args.push(
                            '-c:v', 'libvpx-vp9',
                            '-crf', crf.toString(),
                            '-b:v', '0',               // Required for constant quality mode in VP9
                            '-cpu-used', cpuUsed,      // Controls encoding speed vs quality
                            '-row-mt', '1',            // Enables multi-threading for faster processing
                            '-c:a', 'libopus'
                        );
                    } else {
                        // Standard H.264/AAC for MP4, MKV, MOV
                        args.push(
                            '-c:v', 'libx264',
                            '-preset', preset,
                            '-crf', crf.toString(),
                            '-c:a', 'aac'
                        );
                    }
                }
            }

            args.push(outputPath);
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