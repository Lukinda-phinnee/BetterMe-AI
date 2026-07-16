import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { supabase } from '../lib/supabase'

const router: Router = Router()

// Get cards for board
router.get('/', authMiddleware, async (req, res) => {
  try {
    const boardId = req.query.board_id
    
    let query = supabase
      .from('cards')
      .select('*')
    
    if (boardId) {
      query = query.eq('board_id', boardId)
    }

    const { data, error } = await query
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cards' })
  }
})

// Create card
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      board_id, 
      list_id, 
      title, 
      description,
      due_date,
      priority,
      labels,
      assignees,
      checklist,
      color,
      column_status
    } = req.body
    
    console.log('Creating card with board_id:', board_id)
    console.log('Card data:', { board_id, title, column_status })
    
    // Parse subtasks from comma-separated string to checklist format
    let parsedChecklist = checklist
    if (typeof checklist === 'string' && checklist.trim()) {
      parsedChecklist = checklist.split(',').map((item: string, index: number) => ({
        id: index + 1,
        text: item.trim(),
        completed: false
      }))
    }

    // Parse assignee from initials to assignees array
    let parsedAssignees = assignees
    if (typeof assignees === 'string' && assignees.trim()) {
      parsedAssignees = [{ initials: assignees.trim() }]
    }

    // Parse labels from category/tag
    let parsedLabels = labels
    if (typeof labels === 'string' && labels.trim()) {
      parsedLabels = [{ name: labels, type: 'category' }]
    }

    const { data, error } = await supabase
      .from('cards')
      .insert({
        board_id,
        list_id,
        title,
        description,
        due_date: due_date || null,
        priority: priority || 'medium',
        labels: parsedLabels || [],
        assignees: parsedAssignees || [],
        checklist: parsedChecklist || [],
        color: color || '#e0f2fe',
        column_status: column_status || 'todo',
        position: 0 // Will be updated by client or another endpoint
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating card:', error)
      throw error
    }
    console.log('Card created successfully:', data)
    res.json(data)
  } catch (error: any) {
    console.error('Error creating card:', error)
    res.status(500).json({ error: error.message || 'Failed to create card' })
  }
})

// Update card
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update card' })
  }
})

export { router as cardsRouter }
