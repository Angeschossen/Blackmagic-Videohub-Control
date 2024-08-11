/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    experimental: {
        instrumentationHook: true,
        swcPlugins: [['fluentui-next-appdir-directive', { paths: ['@griffel', '@fluentui'] }]],
    },
    transpilePackages: ["@fluentui/react-components"]
};

export default nextConfig;
