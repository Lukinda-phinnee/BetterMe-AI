import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { supabase } from '../lib/supabase'

const router: Router = Router()

// Get all workspaces for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', req.user.id)

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspaces' })
  }
})

// Create workspace
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body
    
    console.log('Creating workspace with user_id:', req.user.id)
    
    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        user_id: req.user.id,
        name,
        description
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating workspace:', error)
      throw error
    }
    res.json(data)
  } catch (error: any) {
    console.error('Error creating workspace:', error)
    res.status(500).json({ error: error.message || 'Failed to create workspace' })
  }
})

export { router as workspacesRouter }
