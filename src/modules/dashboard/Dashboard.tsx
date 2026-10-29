import { Stack } from '@mantine/core';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    return (
        <Stack p='sm'>
            <h2>Dashboard</h2>
            <Link to='/re-encode-mp4'>ReEncode MP4</Link>
            <p>Second</p>
            <p>Third</p>
        </Stack>
    );
}