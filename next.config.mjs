/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nuuakkmhkkyajioaydqe.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
      allowedOrigins: ["*"],
    },
    proxyClientMaxBodySize: "50mb",
  },
}

export default nextConfig
