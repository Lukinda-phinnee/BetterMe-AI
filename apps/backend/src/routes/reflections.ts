import express, { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router: Router = express.Router()

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// POST /api/reflections - Save weekly review
router.post('/', async (req, res) => {
  try {
    const { userId, workedWell, didntWork, patterns, adjustment, implementation, weekData } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Calculate week range
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(now)
    weekEnd.setHours(23, 59, 59, 999)

    // Check if a reflection already exists for this week
    const { data: existingReflection } = await supabase
      .from('weekly_reflections')
      .select('*')
      .eq('user_id', userId)
      .gte('week_start', weekStart.toISOString())
      .lte('week_end', weekEnd.toISOString())
      .single()

    if (existingReflection) {
      // Update existing reflection
      const { data, error } = await supabase
        .from('weekly_reflections')
        .update({
          worked_well: workedWell,
          didnt_work: didntWork,
          patterns,
          adjustment,
          implementation,
          week_data: weekData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReflection.id)
        .select()
        .single()

      if (error) throw error

      return res.json(data)
    }

    // Create new reflection
    const { data, error } = await supabase
      .from('weekly_reflections')
      .insert({
        user_id: userId,
        week_start: weekStart.toISOString(),
        week_end: weekEnd.toISOString(),
        worked_well: workedWell,
        didnt_work: didntWork,
        patterns,
        adjustment,
        implementation,
        week_data: weekData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Error saving reflection:', error)
    res.status(500).json({ error: 'Failed to save reflection' })
  }
})

// GET /api/reflections - Get user's reflection history
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 10 } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const { data, error } = await supabase
      .from('weekly_reflections')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(Number(limit))

    if (error) throw error

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching reflections:', error)
    res.status(500).json({ error: 'Failed to fetch reflections' })
  }
})

// GET /api/reflections/current - Get current week's reflection
router.get('/current', async (req, res) => {
  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Calculate current week range
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(now)
    weekEnd.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('weekly_reflections')
      .select('*')
      .eq('user_id', userId)
      .gte('week_start', weekStart.toISOString())
      .lte('week_end', weekEnd.toISOString())
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found", which is acceptable
      throw error
    }

    res.json(data || null)
  } catch (error) {
    console.error('Error fetching current reflection:', error)
    res.status(500).json({ error: 'Failed to fetch current reflection' })
  }
})

export { router as reflectionsRouter }
