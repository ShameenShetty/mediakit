import { AppShell, Box, NavLink, Stack, Text } from '@mantine/core';
import {
    IconHome,
    IconPhoto,
    IconScissors,
    IconSettings,
    IconSparkles,
    IconVolume
} from '@tabler/icons-react';
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AppLayout() {
    const [hovered, setHovered] = useState(false);
    const location = useLocation();

    // Reusable Label component
    const NavLabel = ({ text }: { text: string }) => (
        <span className="nav-label" style={{ whiteSpace: 'nowrap' }}>
            {text}
        </span>
    );

    // Reusable Section Header
    const SectionHeader = ({ title }: { title: string }) => (
        <Box className="nav-section-header">
            <Text size="xs" fw={700} c="dimmed" px="sm" pt={4} tt="uppercase" style={{ whiteSpace: 'nowrap' }}>
                {title}
            </Text>
        </Box>
    );

    return (
        <AppShell
            navbar={{
                width: hovered ? 220 : 80,
                breakpoint: 'sm',
            }}
            styles={{
                main: { backgroundColor: '#f4f8fa' },
                navbar: { backgroundColor: '#f4f8fa' },
            }}
        >
            <AppShell.Navbar
                p="xs"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={hovered ? 'nav-expanded' : 'nav-collapsed'}
                style={{
                    overflowX: 'hidden',
                    transition: 'width 0.2s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Stack gap="xs" style={{ flex: 1, overflow: 'hidden' }}>
                    {/* Home */}
                    <NavLink
                        component={Link}
                        to="/"
                        active={location.pathname === '/'}
                        leftSection={<IconHome size={22} />}
                        label={<NavLabel text="Home" />}
                        title="Home"
                    />

                    {/* Section: Edit & Audio */}
                    <SectionHeader title="Edit & Audio" />
                    <NavLink
                        component={Link}
                        to="/clip"
                        active={location.pathname === '/clip'}
                        leftSection={<IconScissors size={22} />}
                        label={<NavLabel text="Clip & Cut" />}
                        title="Clip & Cut"
                    />
                    <NavLink
                        component={Link}
                        to="/audio-toolkit"
                        active={location.pathname === '/audio-toolkit'}
                        leftSection={<IconVolume size={22} />}
                        label={<NavLabel text="Audio Toolkit" />}
                        title="Audio Toolkit"
                    />
                    <NavLink
                        component={Link}
                        to="/thumbnails"
                        active={location.pathname === '/thumbnails'}
                        leftSection={<IconPhoto size={22} />}
                        label={<NavLabel text="Thumbnails" />}
                        title="Thumbnails"
                    />

                    {/* Section: Advanced */}
                    <SectionHeader title="Advanced" />
                    <NavLink
                        component={Link}
                        to="/upscale"
                        active={location.pathname === '/upscale'}
                        leftSection={<IconSparkles size={22} />}
                        label={<NavLabel text="Upscale" />}
                        title="Upscale"
                    />
                </Stack>

                {/* Settings at the bottom */}
                <Box pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
                    <NavLink
                        component={Link}
                        to="/settings"
                        active={location.pathname === '/settings'}
                        leftSection={<IconSettings size={22} />}
                        label={<NavLabel text="Settings" />}
                        title="Settings"
                    />
                </Box>
            </AppShell.Navbar>

            <AppShell.Main style={{ overflowX: 'auto', minHeight: '100vh' }}>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}