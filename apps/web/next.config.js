/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@xpid/shared', '@xpid/ui'],
  serverExternalPackages: ['@prisma/client'],
}

export default nextConfig
