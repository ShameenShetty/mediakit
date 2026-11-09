import { createTheme } from '@mantine/core';

export const appTheme = createTheme({
    primaryColor: 'cyan',
    defaultRadius: 'md',
    components: {
        Paper: {
            defaultProps: {
                bg: '#edf3f7',
            },
            styles: () => ({
                root: {
                    borderColor: '#e2e8f0',
                },
            }),
        },
    },
});