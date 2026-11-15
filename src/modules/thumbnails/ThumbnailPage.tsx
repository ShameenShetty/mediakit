import { useState } from 'react';
import {
    Container,
    Title,
    Group,
    Select,
    Button,
    TextInput,
    Text,
    Paper,
    Stack
} from '@mantine/core';
import { IconPhoto, IconArrowRight, IconPlayerPlay } from '@tabler/icons-react';
import { basename, extname, dirname } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';
import { Command } from '@tauri-apps/plugin-shell';
import { notifications } from '@mantine/notifications';
import { audioFormats } from '../../constants/mediaOptions';
import { selectInputFile } from '../../utils/selectInputFile';
import { buildThumbnailArgs } from '../../services/thumbnailServices';
import { calculateEta } from '../../utils/calculateEta';
import { extractProgress } from '../../utils/extractProgress';
import { extractSpeed } from '../../utils/extractSpeed';
import { getDuration } from '../../utils/getDuration';
import { getOutputFileName } from '../../utils/getOutputFileName';

const thumbnailOperations = [
    { value: 'get-thumbnail', label: 'Get Thumbnail (Extract)' },
    { value: 'set-thumbnail', label: 'Set Thumbnail (Embed)' },
];

export function ThumbnailPage() {
    const [inputPath, setInputPath] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [fileExt, setFileExt] = useState<string>('');
    const [isAudioFile, setIsAudioFile] = useState<boolean>(false);

    const [operation, setOperation] = useState<string>('get-thumbnail');

    // Conditional state parameters
    const [timestamp, setTimestamp] = useState<string>('00:00:01'); // For video frame extraction
    const [imagePath, setImagePath] = useState<string>(''); // For setting thumbnail/artwork
    const [imageFileName, setImageFileName] = useState<string>('');

    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [_, setSpeed] = useState<number>(0);
    const [eta, setEta] = useState<string>('Calculating...');

    const handleSelectInputFile = async () => {
        const selected = await selectInputFile({ mediaType: ['audio', 'video'] });

        if (selected && typeof selected === 'string') {
            setInputPath(selected);
            const name = await basename(selected);
            const ext = (await extname(selected)).toLowerCase();

            setFileName(name);
            setFileExt(ext);
            const isAudio = audioFormats.includes(ext);
            setIsAudioFile(isAudio);
        }
    };

    const handleSelectImageFile = async () => {
        const selected = await open({
            multiple: false,
            filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }]
        });

        if (selected && typeof selected === 'string') {
            setImagePath(selected);
            const name = await basename(selected);
            setImageFileName(name);
        }
    };

    const handleRunOperation = async () => {
        if (!inputPath) {
            notifications.show({ title: 'Error', message: 'Please select an input file first.', color: 'red' });
            return;
        }

        if (operation === 'set-thumbnail' && !imagePath) {
            notifications.show({ title: 'Error', message: 'Please select a cover image to embed.', color: 'red' });
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setSpeed(0);
        setEta('Calculating...');

        try {
            // For duration-based progress calculation if input is video/audio
            const duration = isAudioFile ? 5.0 : await getDuration(inputPath);
            const parentDir = await dirname(inputPath);

            // Determine output path & extension
            let suffix = 'thumbnail';
            let targetExt = fileExt;

            if (operation === 'get-thumbnail') {
                suffix = 'cover';
                targetExt = 'jpg'; // Extracted artwork/frame defaults to jpg
            } else {
                suffix = 'embedded';
            }

            // Generate a unique output path with collision handling and custom extension support
            const outputPath = await getOutputFileName(inputPath, parentDir, `_${suffix}`, targetExt);
            console.log('Thumbnail Output Path - ', outputPath);

            const args = buildThumbnailArgs({
                inputPath,
                outputPath,
                operation: operation as 'get-thumbnail' | 'set-thumbnail',
                timestamp,
                imagePath,
                isAudioFile,
            });

            console.log('Built thumbnail arguments - ', args);

            const command = Command.sidecar('binaries/mediaProcessor', args);

            command.stderr.on('data', (line) => {
                console.log('MediaProcessor stderr:', line);
                if (line.includes('time=')) {
                    const p = extractProgress(duration, line) || 0;
                    setProgress(p);

                    if (line.includes('speed=')) {
                        const extractedSpeed = extractSpeed(line) || 0;
                        setSpeed(extractedSpeed);

                        const calculatedEta = calculateEta(p, extractedSpeed, duration);
                        setEta(calculatedEta);
                    }
                }
            });

            command.on('close', (data) => {
                setIsProcessing(false);
                if (data.code === 0) {
                    setProgress(100);
                    setSpeed(0);
                    setEta('0h 0m 0s');
                    notifications.show({ title: 'Success', message: 'Thumbnail operation completed successfully!', color: 'green' });
                } else {
                    notifications.show({ title: 'Error', message: `Process failed with code ${data.code}`, color: 'red' });
                }
            });

            await command.spawn();

        } catch (err) {
            setIsProcessing(false);
            notifications.show({ title: 'Error', message: String(err), color: 'red' });
        }
    };

    return (
        <Container size='xl' py='xl'>
            <Title order={2} mb='xl'>Thumbnail & Artwork Toolkit</Title>

            {/* Pipeline Layout */}
            <Paper withBorder p='md' radius='md' mb='xl'>
                <Group align='center' grow preventGrowOverflow={false} wrap='nowrap'>

                    {/* Input File Selector */}
                    <Stack gap='2'>
                        <Text size='sm' fw={500}>Input Media File</Text>
                        <Button
                            variant='default'
                            onClick={handleSelectInputFile}
                            fullWidth
                            styles={{ root: { justifyContent: 'space-between' } }}
                        >
                            <Text truncate>{fileName || 'Choose file...'}</Text>
                            <IconPhoto size={16} />
                        </Button>
                    </Stack>

                    <IconArrowRight size={20} style={{ minWidth: 20, color: 'var(--mantine-color-dimmed)' }} />

                    {/* Operation Selector */}
                    <Stack gap='2'>
                        <Text size='sm' fw={500}>Operation</Text>
                        <Select
                            value={operation}
                            onChange={(val) => val && setOperation(val)}
                            data={thumbnailOperations}
                        />
                    </Stack>

                    <IconArrowRight size={20} style={{ minWidth: 20, color: 'var(--mantine-color-dimmed)' }} />

                    {/* Conditional Parameter Selector */}
                    <Stack gap='2'>
                        <Text size='sm' fw={500}>
                            {operation === 'get-thumbnail' ? 'Timestamp (Video)' : 'Cover Image'}
                        </Text>
                        {operation === 'get-thumbnail' ? (
                            <TextInput
                                value={timestamp}
                                onChange={(e) => setTimestamp(e.currentTarget.value)}
                                placeholder='00:00:01'
                                disabled={isAudioFile} // Audio files don't need timestamp scraping
                            />
                        ) : (
                            <Button
                                variant='default'
                                onClick={handleSelectImageFile}
                                fullWidth
                                styles={{ root: { justifyContent: 'space-between' } }}
                            >
                                <Text truncate>{imageFileName || 'Select image...'}</Text>
                                <IconPhoto size={16} />
                            </Button>
                        )}
                    </Stack>

                </Group>
            </Paper>

            {/* Execution Bar */}
            <Group justify='space-between' align='center'>
                <Button
                    leftSection={<IconPlayerPlay size={16} />}
                    onClick={handleRunOperation}
                    disabled={!inputPath || (operation === 'set-thumbnail' && !imagePath)}
                    loading={isProcessing}
                >
                    Run Operation
                </Button>
                <Text size='sm' c='dimmed'>
                    Progress: {progress.toFixed(2)}% {isProcessing && `| ETA: ${eta}`}
                </Text>
            </Group>
        </Container>
    );
}