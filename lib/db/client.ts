import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neon } from '@neondatabase/serverless'

// 懒加载 Prisma Client
let _prisma: PrismaClient | undefined

export const getPrisma = () => {
  if (!_prisma) {
    // 使用运行时环境变量
    const connectionString = process.env.DATABASE_URL as string
    
    if (!connectionString || connectionString.length < 30) {
      throw new Error(`DATABASE_URL 未配置或格式错误：${connectionString ? `长度=${connectionString.length}` : 'undefined'}`)
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

// 为了兼容性导出 prisma（但只在运行时使用）
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma()
    return (client as any)[prop]
  },
})

export default prisma
