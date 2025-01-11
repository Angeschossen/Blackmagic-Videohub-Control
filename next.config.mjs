import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    experimental: {
        instrumentationHook: true,
        swcPlugins: [['fluentui-next-appdir-directive', { paths: ['@griffel', '@fluentui'] }]],
    },
    transpilePackages: ["@fluentui/react-components"],
    async redirects() {
        return [
            {
                source: '/',
                destination: '/videohubs',
                permanent: true,
            },
        ]
    }
};

export default withNextIntl(nextConfig);
