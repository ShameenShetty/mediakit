export interface BuildArgsOptions {
    inputPath: string;
    outputPath: string;
    scale: string;
    qv: string;
    gpuEncoder: string;
}

export const buildUpscaleArgs = (options: BuildArgsOptions): string[] => {
    const { inputPath, outputPath, scale: resolution, qv, gpuEncoder } = options;
    const scale = resolution.replace('x', ':');

    let args: string[] = ['-i', inputPath];

    args.push('-vf', `scale=${scale}:flags=lanczos`);
    args.push('-c:v', gpuEncoder, '-q:v', qv, '-tag:v', 'hvc1');
    args.push('-c:a', 'copy');

    args.push(outputPath);
    return args;
};