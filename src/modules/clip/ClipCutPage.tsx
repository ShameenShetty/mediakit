import {
    Button,
    Container,
    Group,
    Paper,
    Stack,
    Text,
    TextInput,
    Title
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowRight, IconPlayerPlay, IconScissors } from '@tabler/icons-react';
import { basename, dirname, extname } from '@tauri-apps/api/path';
import { Command } from '@tauri-apps/plugin-shell';
import { useState } from 'react';
import { audioFormats } from '../../constants/mediaOptions';
import { buildClipArgs } from '../../services/clipToolkitServices';
import { calculateEta } from '../../utils/calculateEta';
import { extractProgress } from '../../utils/extractProgress';
import { extractSpeed } from '../../utils/extractSpeed';
import { getDuration } from '../../utils/getDuration';
import { selectInputFile } from '../../utils/selectInputFile';
import { parseTimeToSeconds, formatSecondsToTimecode } from '../../utils/timeParser';

// TODO (Future Feature - Advanced Media Splicing & Preview):
// - Integrate an embedded media player (e.g. HTML5 video/audio player or wavesurfer.js for audio waveforms)
// - Add dynamic range slider / dual scrubbers to visually adjust start and end cut points
// - Implement live preview playback for the selected cut segment prior to processing
//  (similar to mp3cut.net / online-video-cutter.com)
// - Support multi-segment timeline selection (cutting multiple sections out of a single file and merging them)
export function ClipCutPage() {
    const [inputPath, setInputPath] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [fileExt, setFileExt] = useState<string>('');
    const [isAudioFile, setIsAudioFile] = useState<boolean>(false);
    const [fileDuration, setFileDuration] = useState<number>(0);

    // Clip timing parameters
    // Change states from number to string to support timecodes like '1:20:10'
    const [startTimeStr, setStartTimeStr] = useState<string>('0');
    const [endTimeStr, setEndTimeStr] = useState<string>('10');

    // Computed numeric seconds for logic/validation
    const startTimeSec = parseTimeToSeconds(startTimeStr);
    const endTimeSec = parseTimeToSeconds(endTimeStr);

    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [_, setSpeed] = useState<number>(0);
    const [eta, setEta] = useState<string>('Calculating...');

    const handleSelectInputFile = async () => {
        const selected = await selectInputFile('both');

        if (selected && typeof selected === 'string') {
            setInputPath(selected);
            const name = await basename(selected);
            const ext = (await extname(selected)).toLowerCase();

            setFileName(name);
            setFileExt(ext);
            const isAudio = audioFormats.includes(ext);
            setIsAudioFile(isAudio);

            try {
                const duration = await getDuration(selected);
                setFileDuration(duration);
                setStartTimeStr('0');
                setEndTimeStr(Math.min(duration, 10).toString());
            } catch (err) {
                console.error('Failed to get duration:', err);
                setFileDuration(0);
            }
        }
    };

    const handleRunOperation = async () => {
        if (!inputPath) {
            notifications.show({ title: 'Error', message: 'Please select an input file first.', color: 'red' });
            return;
        }

        if (startTimeSec < 0 || endTimeSec <= startTimeSec || endTimeSec > fileDuration) {
            notifications.show({ title: 'Error', message: 'Please verify that start time is >= 0 and end time is greater than start time and within file duration.', color: 'red' });
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setSpeed(0);
        setEta('Calculating...');

        try {
            const clipDuration = endTimeSec - startTimeSec;
            const parentDir = await dirname(inputPath);
            const baseName = fileName.slice(0, -(fileExt.length + 1));
            const outputPath = `${parentDir}/${baseName}_clipped.${fileExt}`;

            console.log('Clip Output Path - ', outputPath);

            const args = buildClipArgs({
                inputPath,
                outputPath,
                startTime: startTimeSec,
                endTime: endTimeSec,
                isAudioFile,
            });

            console.log('Built clip arguments - ', args);

            const command = Command.sidecar('binaries/ffmpeg', args);

            command.stderr.on('data', (line) => {
                console.log('FFmpeg stderr:', line);
                if (line.includes('time=')) {
                    const p = extractProgress(clipDuration, line) || 0;
                    setProgress(p);

                    if (line.includes('speed=')) {
                        const extractedSpeed = extractSpeed(line) || 0;
                        setSpeed(extractedSpeed);

                        const calculatedEta = calculateEta(p, extractedSpeed, clipDuration);
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
                    notifications.show({ title: 'Success', message: 'Clip & cut operation completed successfully!', color: 'green' });
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
            <Title order={2} mb='xl'>Clip & Cut Toolkit</Title>

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
                            maw={260}
                            styles={{
                                root: {
                                    justifyContent: 'space-between',
                                    overflow: 'hidden'
                                },
                                label: {
                                    width: '100%',
                                    overflow: 'hidden'
                                }
                            }}
                        >
                            <Text truncate style={{ flex: 1, textAlign: 'left' }}>
                                {fileName || 'Choose file...'}
                            </Text>
                            <IconScissors size={16} style={{ flexShrink: 0, marginLeft: 8 }} />
                        </Button>
                    </Stack>

                    <IconArrowRight size={20} style={{ minWidth: 20, color: 'var(--mantine-color-dimmed)' }} />

                    {/* Start Time Selector */}
                    <Stack gap='2'>
                        <Text size='sm' fw={500}>Start Time (sec or HH:MM:SS)</Text>
                        <TextInput
                            value={startTimeStr}
                            onChange={(e) => setStartTimeStr(e.currentTarget.value)}
                            placeholder='0 or 00:00:00'
                            disabled={!inputPath}
                        />
                    </Stack>

                    <IconArrowRight size={20} style={{ minWidth: 20, color: 'var(--mantine-color-dimmed)' }} />

                    {/* End Time Selector */}
                    <Stack gap='2'>
                        <Text size='sm' fw={500}>
                            End Time {fileDuration > 0 && `(Max: ${formatSecondsToTimecode(fileDuration)})`}
                        </Text>
                        <TextInput
                            value={endTimeStr}
                            onChange={(e) => setEndTimeStr(e.currentTarget.value)}
                            placeholder='10 or 00:00:10'
                            disabled={!inputPath}
                            error={
                                inputPath && endTimeSec <= startTimeSec
                                    ? 'Must be > start time'
                                    : inputPath && endTimeSec > fileDuration
                                        ? `Exceeds max (${fileDuration.toFixed(1)}s)`
                                        : false
                            }
                        />
                    </Stack>
                </Group>
            </Paper>

            {/* Execution Bar */}
            <Group justify='space-between' align='center'>
                <Button
                    leftSection={<IconPlayerPlay size={16} />}
                    onClick={handleRunOperation}
                    disabled={!inputPath || endTimeSec <= startTimeSec || endTimeSec > fileDuration}
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