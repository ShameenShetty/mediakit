const PROGRESS_REGEX = /speed=(\d+\.?\d*)/;

export const extractSpeed = (line: string): number | undefined => {
    const matches = line.match(PROGRESS_REGEX);

    if (matches && matches.length === 2) {
        const speed = Number(matches[1]);
        console.log('Speed match - ', speed)
        return speed;
    } else {
        console.log('No matches found or less than 2 matches');
        return undefined;
    }
}