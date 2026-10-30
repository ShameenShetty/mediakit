const PROGRESS_REGEX = /time=(\d+):(\d+):(\d+)/;

export const extractProgress = (duration: number, line: string): number | undefined => {
    const matches = line.match(PROGRESS_REGEX);

    if (matches && matches.length === 4) {
        const hour = Number(matches[1]);
        const min = Number(matches[2]);
        const sec = Number(matches[3]);

        const elapsedSeconds = (hour * 3600) + (min * 60) + sec;
        const progress = (elapsedSeconds / duration) * 100;

        // Cap it at 100% just in case FFmpeg overshoots slightly at the very end
        return Math.min(progress, 100);
    } else {
        console.log('No matches found or less than 4 matches');
        return undefined;
    }
}