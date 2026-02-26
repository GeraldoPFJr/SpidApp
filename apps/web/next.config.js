/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@xpid/shared', '@xpid/ui'],
  serverExternalPackages: ['@prisma/client'],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    }
    return config
  },
}

export default nextConfig
