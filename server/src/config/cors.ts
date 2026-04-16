import type { CorsOptions } from 'cors'
import { env } from './env'

export const corsOptions: CorsOptions = {
  origin: env.CLIENT_URL,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
}
