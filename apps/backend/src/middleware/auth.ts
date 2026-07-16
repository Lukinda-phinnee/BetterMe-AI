import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization header' })
    }

    const token = authHeader.substring(7)
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Attach user to request
    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' })
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}
