/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Restoring Next14 client cache behavior
    staleTimes: {
      dynamic: 30,
    },
  },
  // Used by Lucia for password hashing
  // https://lucia-auth.com/tutorials/username-and-password/nextjs-app
  serverExternalPackages: ["@node-rs/argon2"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/**`,
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  rewrites: () => {
    return [
      {
        source: "/hashtag/:tag",
        destination: "/search?query=%23:tag",
      },
    ];
  },
};

export default nextConfig;
