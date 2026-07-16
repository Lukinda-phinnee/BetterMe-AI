import { Router } from 'express'
import { supabase } from '../lib/supabase'
const router: Router = Router()

router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`
      }
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ 
      message: 'Account created successfully. Please check your email to verify.',
      user: data.user 
    })
  } catch (error) {
    res.status(500).json({ error: 'Sign up failed' })
  }
})

// Sign in endpoint
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    res.json({ 
      user: data.user,
      session: data.session 
    })
  } catch (error) {
    res.status(500).json({ error: 'Sign in failed' })
  }
})

// Verify token endpoint
router.get('/verify', async (req, res) => {
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

    res.json({ user })
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' })
  }
})

export { router as authRouter }
