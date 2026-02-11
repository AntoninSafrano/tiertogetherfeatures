import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/tiertogether'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GOOGLE_CLIENT_ID: z.string().default('YOUR_GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: z.string().default('YOUR_GOOGLE_CLIENT_SECRET'),
  JWT_SECRET: z.string().default('your-jwt-secret-change-in-production'),
})

export const env = envSchema.parse(process.env)
