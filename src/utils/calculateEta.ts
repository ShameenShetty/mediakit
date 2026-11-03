export const calculateEta = (progress: number, speed: number, duration: number): string => {
    console.log('Calculating ETA - progress:', progress, 'speed:', speed, 'duration:', duration);

    if (progress <= 0 || speed <= 0 || duration <= 0 || progress >= 100) {
        return progress >= 100 ? 'Completed' : 'Calculating...';
    }

    // Calculate how many seconds of the video are left to process
    const remainingVideoSeconds = duration * (1 - progress / 100);

    // Adjust for the current processing speed (e.g., speed < 1 means slower than real-time)
    const estimatedTotalSeconds = remainingVideoSeconds / speed;

    const hours = Math.floor(estimatedTotalSeconds / 3600);
    const minutes = Math.floor((estimatedTotalSeconds % 3600) / 60);
    const seconds = Math.floor(estimatedTotalSeconds % 60);

    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;
};