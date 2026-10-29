import { AppShell } from '@mantine/core';
import { Outlet } from 'react-router-dom';

export default function AppLayout() {
    return (
        <AppShell>
            <Outlet />
        </AppShell>
    );
}