import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth'
import { workspacesRouter } from './routes/workspaces'
import { boardsRouter } from './routes/boards'
import { cardsRouter } from './routes/cards'
import { goalsRouter } from './routes/goals'
import { habitsRouter } from './routes/habits'
import { reflectionsRouter } from './routes/reflections'
import aiRouter from './routes/ai'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : process.env.FRONTEND_URL || '*'

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/auth', authRouter)
app.use('/api/workspaces', workspacesRouter)
app.use('/api/boards', boardsRouter)
app.use('/api/cards', cardsRouter)
app.use('/api/goals', goalsRouter)
app.use('/api/habits', habitsRouter)
app.use('/api/reflections', reflectionsRouter)
app.use('/api/ai', aiRouter)

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
})
