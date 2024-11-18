/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["utfs.io", "gateway.pinata.cloud"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
      },
      {
        protocol: "https",
        hostname: "hpxyl1kpx81zbobg.public.blob.vercel-storage.com",
        port: "",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
      timeout: 60000,
    },
  },
};

export default nextConfig;
