import {
    ActionIcon,
    Button,
    Center,
    Divider,
    Group,
    Paper,
    Progress,
    Select,
    Stack,
    Text,
    Title,
    Tooltip
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowRight, IconHelp } from '@tabler/icons-react';
import { basename, dirname, extname } from '@tauri-apps/api/path';
import { Command } from '@tauri-apps/plugin-shell';
import { useState } from 'react';
import { audioFormats, compressionPresets, encodingEffort, imageFormats, inputFileTypes, operations, videoFormats, outputQualityOptions } from '../../constants/mediaOptions';
import { buildFfmpegArgs } from '../../services/ffmpegServices';
import { calculateEta } from '../../utils/calculateEta';
import { extractProgress } from '../../utils/extractProgress';
import { extractSpeed } from '../../utils/extractSpeed';
import { getDuration } from '../../utils/getDuration';
import { getInputFileType } from '../../utils/getInputFileType';
import { getOutputFileName } from '../../utils/getOutputFileName';
import { selectInputFile } from '../../utils/selectInputFile';
import { buildMagickArgs } from '../../services/magickServices';

export default function HomePage() {
    const [inputPath, setInputPath] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [fileExt, setFileExt] = useState<string>('');
    const [inputFileType, setInputFileType] = useState<inputFileTypes>('audio');

    const [operation, setOperation] = useState<string>('convert');
    const [outputFormat, setOutputFormat] = useState<string>('mp4');
    const [compressionMode, setCompressionMode] = useState<string>('balanced');

    // Advanced settings state
    const [preset, setPreset] = useState<string>('medium');
    const [crf, setCrf] = useState('23');

    const [progress, setProgress] = useState<number>(0);
    const [_, setSpeed] = useState<number>(0);
    const [eta, setEta] = useState<string>('N/A');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    async function handleSelectFile() {
        const selected = await selectInputFile({ mediaType: ['all'] });

        if (selected && typeof selected === 'string') {
            setInputPath(selected);
            const name = await basename(selected);
            const ext = (await extname(selected)).toLowerCase();

            setFileName(name);
            setFileExt(ext);

            const fileType = getInputFileType(ext);
            setInputFileType(fileType);

            if (operation === 'reencode' || operation === 'compress') {
                setOutputFormat(ext);
            } else {
                // Default convert target
                setOutputFormat(fileType === 'audio' ? (ext === 'mp3' ? 'm4a' : 'mp3') :
                    fileType === 'video' ? (ext === 'mp4' ? 'mkv' : 'mp4') :
                        (ext === 'jpg' ? 'png' : 'jpg')
                );
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

            let endName = '';
            operation === 'reencode' ? endName = 'reencoded' : endName = operation + 'ed';

            // Generate a unique output path using the utility function to prevent file collision
            const outputPath = await getOutputFileName(inputPath, parentDir, `_${endName}`, outputFormat);

            let args: string[] = [];
            let command: Command<string>;
            if (inputFileType === 'image') {
                console.log('Calling buildMagickArgs')

                args = buildMagickArgs({
                    inputPath,
                    outputPath,
                    operation,
                    outputFormat,
                    fileType: inputFileType,
                    compressionMode,
                    quality: Number(crf)
                });

                command = Command.sidecar('binaries/magick', args);
            } else {
                console.log('Calling buildFfmpegArgs')

                args = buildFfmpegArgs({
                    inputPath,
                    outputPath,
                    operation,
                    outputFormat,
                    fileType: inputFileType,
                    compressionMode,
                    preset,
                    crf: Number(crf)
                });

                command = Command.sidecar('binaries/ffmpeg', args);
            }

            console.log('Running operation:', { inputPath, operation, outputFormat, compressionMode, preset, crf });
            console.log('Executing FFmpeg with args:', args);

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
        <Stack p='lg' gap='md'>
            <Center pb={10}><Title order={2}>MediaKit Workspace</Title></Center>

            {/* 3-Step Pipeline Flow */}
            <Paper withBorder p='md' radius='md' mb='xl'>
                <Group align='flex-end' gap='md'>
                    <Stack gap={4}>
                        <Text size='sm' fw={500}>Input File</Text>
                        <Button variant='default' onClick={handleSelectFile} w={180}>
                            {fileName ? fileName : 'Choose file...'}
                        </Button>
                    </Stack>
                    <IconArrowRight size={22} style={{ marginBottom: 10 }} />

                    {/* Operation Select */}
                    <Select
                        label={
                            <Group gap='4'>
                                <Text>Operation</Text>
                                <Tooltip
                                    multiline
                                    w={260}
                                    withArrow
                                    position='top'
                                    label={
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div>• <b>Convert</b>: Transcodes audio and video streams into your chosen target format.</div>

                                            <div>• <b>Re-Encode</b>: Re-compresses video and audio streams using standard codecs (H.264/AAC) while maintaining container compatibility.</div>

                                            <div>• <b>Compress</b>: Lowers bitrate to reduce file size.</div>
                                        </div>
                                    }
                                >
                                    <IconHelp
                                        size={16}
                                        style={{ cursor: 'help', color: 'var(--mantine-color-dimmed)' }}
                                    />
                                </Tooltip>
                            </Group>
                        }
                        w={120}
                        // Re-encode doesn't make sense for images so we filter it out
                        data={inputFileType !== 'image' ? operations : operations.filter(f => f.value !== 'reencode')}
                        value={operation}
                        onChange={(val) => {
                            if (val) {
                                setOperation(val);
                                if ((val === 'reencode' || val === 'compress') && inputPath) {
                                    setOutputFormat(fileExt);
                                } else if (val === 'convert' && inputPath) {
                                    setOutputFormat(
                                        inputFileType === 'audio' ? 'mp3' :
                                            inputFileType === 'video' ? 'mp4' : 'jpg'
                                    );
                                }
                            }
                        }}
                    />

                    <IconArrowRight size={22} style={{ marginBottom: 10 }} />
                    {operation === 'compress' ? (
                        <Select
                            label='Compression Level'
                            w={180}
                            data={compressionPresets}
                            value={compressionMode}
                            onChange={(val) => val && setCompressionMode(val)}
                        />
                    ) : (
                        <Select
                            key={`${inputFileType}-formats`}
                            label='Output Format'
                            w={180}
                            disabled={operation === 'reencode'}
                            data={inputFileType === 'audio' ?
                                audioFormats.filter(f => f !== fileExt) :
                                inputFileType === 'video' ?
                                    videoFormats.filter(f => f !== fileExt) :
                                    imageFormats.filter(f => f !== fileExt)
                            }
                            value={outputFormat}
                            onChange={(val) => val && setOutputFormat(val)}
                        />
                    )}
                </Group>
            </Paper>

            {/* Encoding Options */}
            <Stack px='md' bg='var(--mantine-color-default-hover)' style={{ borderRadius: 8 }} gap='sm'>
                <Text size='sm' fw={600}>Encoding Options</Text>
                <Group grow>
                    <Select
                        label={
                            <Group gap={6}>
                                <span>Encoding Effort</span>
                                <Tooltip
                                    multiline
                                    w={250}
                                    label={
                                        <Stack gap={4}>
                                            <span>Controls how hard the encoder works to compress the file.</span>
                                            <span>• <b>Faster:</b> Reduces time, larger file.</span>
                                            <span>• <b>Thorough:</b> Smaller file, higher CPU usage.</span>
                                        </Stack>
                                    }
                                >
                                    <ActionIcon size="xs" variant="subtle" color="gray">
                                        <IconHelp size={14} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        }
                        data={encodingEffort}
                        value={preset}
                        onChange={(val) => val && setPreset(val)}
                    />

                    <Select
                        label={
                            <Group gap={6}>
                                <span>Output Quality</span>
                                <Tooltip
                                    multiline
                                    w={250}
                                    label={
                                        <Stack gap={4}>
                                            <span>Determines visual fidelity and file size.</span>
                                            <span>• <b>Lossless:</b> Maximum detail.</span>
                                            <span>• <b>Balanced:</b> Ideal sweet spot.</span>
                                            <span>• <b>Compressed:</b> Smaller size.</span>
                                        </Stack>
                                    }
                                >
                                    <ActionIcon size="xs" variant="subtle" color="gray">
                                        <IconHelp size={14} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        }
                        data={outputQualityOptions}
                        value={crf}
                        onChange={(val) => val && setCrf(val)}
                    />
                </Group>
            </Stack>

            <Divider my='sm' />

            {/* Action & Progress */}
            <Group>
                <Button
                    color='blue'
                    onClick={handleRun}
                    disabled={!inputPath || isProcessing}
                    loading={isProcessing}
                >
                    {isProcessing ? 'Processing...' : 'Run Operation'}
                </Button>
                <Text size='sm' c={progress === 100 ? 'blue' : 'gray'}>
                    {progress === 0 ? '' :
                        progress === 100 ? 'Completed' :
                            inputFileType === 'image' ? 'Processing...' : `Progress: ${progress.toFixed(2)}% ETA: ${eta}`}
                </Text>
            </Group>

            {(progress > 0 && inputFileType != 'image') && (
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