/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: false,
  // Nothing here is meant to be shown inside somebody else's page, and one of
  // these pages is where an application is approved to act as you: a consent
  // screen in an invisible frame is a button somebody else decides you pressed.
  // The runner's previews are pages this app frames, which this does not touch.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {key: "X-Frame-Options", value: "DENY"},
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: process.env.NEXT_PUBLIC_FILES_PROTOCOL,
        hostname: process.env.NEXT_PUBLIC_FILES_HOST,
      },
    ],
  },
  experimental: {
    authInterrupts: true,
    optimizePackageImports: [
      "@mantine/core",
      "@mantine/dates",
      "@mantine/hooks",
      "@mantine/notifications",
      "@mantine/tiptap",
      "@mantine/code-highlight",
      "@mantine/carousel",
    ],
  },
};

export default nextConfig;
