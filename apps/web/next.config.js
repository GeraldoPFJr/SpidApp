/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@spid/shared', '@spid/ui'],
  serverExternalPackages: ['@prisma/client'],
}

export default nextConfig
