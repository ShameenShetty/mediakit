export const parseTimeToSeconds = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const str = value.trim();
    if (!str) return 0;

    // If it's a plain number string (e.g. "45.5")
    if (!str.includes(':')) {
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }

    // Parse HH:MM:SS or MM:SS
    const parts = str.split(':').map(Number);
    if (parts.some(isNaN)) return 0;

    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return 0;
};

export const formatSecondsToTimecode = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';

    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
};