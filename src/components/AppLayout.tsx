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

    // Reusable Label component with smooth opacity transition
    const NavLabel = ({ text }: { text: string }) => (
        <span
            className="nav-label"
            style={{
                whiteSpace: 'nowrap',
                opacity: hovered ? 1 : 0,
                visibility: hovered ? 'visible' : 'hidden',
                transition: 'opacity 0.2s ease-in-out'
            }}
        >
            {text}
        </span>
    );

    // Reusable Section Header driven by clean CSS classes
    const SectionHeader = ({ title }: { title: string }) => (
        <Box
            className="nav-section-header"
            style={{
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: hovered ? 'flex-start' : 'center',
                paddingLeft: hovered ? 'var(--mantine-spacing-sm)' : '0px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Collapsed state indicator (dots) */}
            <span className={`nav-dots ${hovered ? 'is-hovered' : ''}`}>
                ···
            </span>

            {/* Expanded state text */}
            <Text
                size="xs"
                fw={700}
                c="dimmed"
                tt="uppercase"
                className={`nav-title ${hovered ? 'is-hovered' : ''}`}
                style={{ whiteSpace: 'nowrap' }}
            >
                {title}
            </Text>
        </Box>
    );

    return (
        <AppShell
            navbar={{
                width: hovered ? 220 : 60,
                breakpoint: 'sm',
            }}
            styles={{
                main: { backgroundColor: '#f4f8fa' },
                navbar: { backgroundColor: '#e9f1f5' },
            }}
        >
            <AppShell.Navbar
                px='6'
                py='xs'
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
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