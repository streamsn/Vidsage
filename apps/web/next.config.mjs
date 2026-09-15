/** @type {import('next').NextConfig} */
const nextConfig = {
  // The shared package ships raw TypeScript source, not a pre-built dist,
  // so Next.js needs to transpile it itself.
  transpilePackages: ["@video-grabber/shared"],
};

export default nextConfig;
