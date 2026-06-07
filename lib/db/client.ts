import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neon } from '@neondatabase/serverless'

// 懒加载 Prisma Client
let _prisma: PrismaClient | undefined

export const getPrisma = () => {
  if (!_prisma) {
    const connectionString = process.env.DATABASE_URL || ''
    console.log('[Prisma] DATABASE_URL 长度:', connectionString.length)
    console.log('[Prisma] DATABASE_URL 前缀:', connectionString.substring(0, 20))
    
    if (!connectionString || connectionString.length < 20) {
      throw new Error('DATABASE_URL 未配置或格式错误')
    }
    
    const neonClient = neon(connectionString)
    const adapter = new PrismaNeon(neonClient)
    _prisma = new PrismaClient({ adapter })
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
