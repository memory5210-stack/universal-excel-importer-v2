/** @type {import('next').NextConfig} */
const nextConfig = {
  // 忽略 TypeScript 错误（部署时不阻塞）
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
