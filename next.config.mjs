/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: false,
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
  // An author now has a single page, /authors/{identity}, with their articles
  // and notes behind tabs carried in `?type`. These send the shapes that used to
  // exist — the singular /author/*, and the per-section sub-routes — to the tab
  // that shows the same content.
  async redirects() {
    return [
      {
        source: "/:lang/author/:identity",
        destination: "/:lang/authors/:identity",
        permanent: true,
      },
      {
        source: "/:lang/:authors(author|authors)/:identity/articles",
        destination: "/:lang/authors/:identity",
        permanent: true,
      },
      {
        source: "/:lang/:authors(author|authors)/:identity/notes",
        destination: "/:lang/authors/:identity?tab=note",
        permanent: true,
      },
      // The dashboard's own-scope listings moved into the matching section as a
      // tab; their edit and create routes stay where they are.
      {
        source: "/dashboard/my/notes",
        destination: "/dashboard/notes?scope=own",
        permanent: true,
      },
      {
        source: "/dashboard/my/comments",
        destination: "/dashboard/comments?scope=own",
        permanent: true,
      },
    ];
  },
  experimental: {
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
