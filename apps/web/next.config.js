/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@spid/shared', '@spid/ui'],
  serverExternalPackages: ['@prisma/client'],
}

export default nextConfig
