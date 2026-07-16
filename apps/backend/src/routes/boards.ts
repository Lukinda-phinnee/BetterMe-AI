import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { supabase } from '../lib/supabase'

const router: Router = Router()

// Get boards for workspace
router.get('/', authMiddleware, async (req, res) => {
  try {
    const workspaceId = req.query.workspace_id
    
    let query = supabase
      .from('boards')
      .select('*')
    
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data, error } = await query
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch boards' })
  }
})

// Create board
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { workspace_id, name, description } = req.body
    
    console.log('Creating board with workspace_id:', workspace_id)
    
    const { data, error } = await supabase
      .from('boards')
      .insert({
        workspace_id,
        name,
        description
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating board:', error)
      throw error
    }
    res.json(data)
  } catch (error: any) {
    console.error('Error creating board:', error)
    res.status(500).json({ error: error.message || 'Failed to create board' })
  }
})

export { router as boardsRouter }
