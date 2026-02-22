import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Alias 'ink' to 'ink-web' on the client so giggles (and other
  // packages that import from 'ink') use the browser-compatible build.
  serverExternalPackages: ['ink'],
  turbopack: {
    resolveAlias: {
      ink: 'ink-web'
    }
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/framework',
        permanent: false
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/:path*.mdx',
        destination: '/llms.mdx/docs/:path*'
      }
    ];
  }
};

export default withMDX(config);
