import { PrismaClient } from '@prisma/client'

// 懒加载 Prisma Client，避免构建时初始化
let _prisma: PrismaClient | undefined

export const getPrisma = () => {
  if (!_prisma) {
    _prisma = new PrismaClient()
  }
  return _prisma
}

// 为了兼容性导出 prisma（但只在运行时使用）
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma()
    return (client as any)[prop]
  },
})

export default prisma
