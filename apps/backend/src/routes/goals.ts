import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { supabase } from '../lib/supabase'

const router: Router = Router()

// Get goals for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id
    const boardId = req.query.board_id
    
    let query = supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
    
    if (boardId) {
      query = query.eq('board_id', boardId)
    }
    
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' })
  }
})

// Create goal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id
    const { board_id, wish, outcome, obstacle, plan, status } = req.body
    
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        board_id,
        wish,
        outcome,
        obstacle,
        plan,
        status: status || 'active'
      })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create goal' })
  }
})

// Update goal
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' })
  }
})

// Delete goal
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    
    // First delete all cards associated with this goal
    const { error: cardsError } = await supabase
      .from('cards')
      .delete()
      .eq('goal_id', id)

    if (cardsError) throw cardsError
    
    // Then delete the goal
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' })
  }
})

export { router as goalsRouter }
