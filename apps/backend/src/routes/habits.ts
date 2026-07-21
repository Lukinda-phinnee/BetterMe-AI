import { Router } from 'express'
import { supabase } from '../lib/supabase'
const router: Router = Router()

// Get all habits for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { data: habits, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch streak rows for all habits of this user
    const { data: streaks } = await supabase
      .from('habit_streaks')
      .select('*')
      .eq('user_id', userId);

    const streakMap = new Map((streaks || []).map(s => [s.habit_id, s]));
    const habitsWithStreaks = (habits || []).map(h => ({
      ...h,
      streak: streakMap.get(h.id) || null
    }));

    res.json(habitsWithStreaks);
  } catch (error: any) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch habits' });
  }
});

// Get habit completions for a user
router.get('/completions', async (req, res) => {
  try {
    const { userId, habitId, startDate, endDate } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let query = supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId);

    if (habitId) {
      query = query.eq('habit_id', habitId);
    }

    if (startDate) {
      query = query.gte('completed_at', startDate);
    }

    if (endDate) {
      query = query.lte('completed_at', endDate);
    }

    const { data: completions, error } = await query.order('completed_at', { ascending: false });

    if (error) throw error;

    res.json(completions || []);
  } catch (error: any) {
    console.error('Error fetching habit completions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch habit completions' });
  }
});

// Get habit streaks for a user
router.get('/streaks', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { data: streaks, error } = await supabase
      .from('habit_streaks')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    res.json(streaks || []);
  } catch (error: any) {
    console.error('Error fetching habit streaks:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch habit streaks' });
  }
});

// Get today's habits with completion status
router.get('/today', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // Get habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (habitsError) throw habitsError;

    // Get today's completions
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', startOfDay)
      .lte('completed_at', endOfDay);

    if (completionsError) throw completionsError;

    // Merge habits with their completion status for today
    const habitsWithStatus = (habits || []).map(habit => {
      const completion = (completions || []).find(c => c.habit_id === habit.id);
      return {
        ...habit,
        completedToday: !!completion,
        completionStatus: completion?.status || null,
        completionId: completion?.id || null,
        completedAt: completion?.completed_at || null,
      };
    });

    res.json(habitsWithStatus || []);
  } catch (error: any) {
    console.error('Error fetching today\'s habits:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch today\'s habits' });
  }
});

// Get habit statistics
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get total active habits
    const { count: totalHabits, error: habitsError } = await supabase
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (habitsError) throw habitsError;

    // Get completions for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', thirtyDaysAgo.toISOString());

    if (completionsError) throw completionsError;

    // Get streaks
    const { data: streaks, error: streaksError } = await supabase
      .from('habit_streaks')
      .select('*')
      .eq('user_id', userId);

    if (streaksError) throw streaksError;

    // Calculate statistics
    const totalCheckIns = completions?.length || 0;
    const currentStreak = streaks?.reduce((max, s) => Math.max(max, s.current_streak), 0) || 0;
    const longestStreak = streaks?.reduce((max, s) => Math.max(max, s.longest_streak), 0) || 0;

    // Calculate consistency rate (completions / (habits * days))
    const daysInMonth = 30;
    const expectedCheckIns = (totalHabits || 0) * daysInMonth;
    const consistencyRate = expectedCheckIns > 0 ? Math.round((totalCheckIns / expectedCheckIns) * 100) : 0;

    // Expected check-ins for the current week (active habits × 7).
    const expectedThisWeek = (totalHabits || 0) * 7;

    // This week's completed check-ins (last 7 days, status = 'done').
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: weeklyCheckIns } = await supabase
      .from('habit_completions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', sevenDaysAgo.toISOString());

    // Count of habits still open today (no completion yet) for the coach insight.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const { data: todayCompletions } = await supabase
      .from('habit_completions')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', startOfToday.toISOString())
      .lte('completed_at', endOfToday.toISOString());
    const completedHabitIdsToday = new Set((todayCompletions || []).map(c => c.habit_id));
    const remainingToday = Math.max(0, (totalHabits || 0) - completedHabitIdsToday.size);

    // Derive a short, data-driven coach message.
    let coachInsight: string;
    if ((totalHabits || 0) === 0) {
      coachInsight = "No active habits yet — add one to start building momentum.";
    } else if (remainingToday === 0) {
      coachInsight = "Every habit checked in today. Nicely done — protect the streak tomorrow.";
    } else if (currentStreak >= 7) {
      coachInsight = `${currentStreak}-day streak in motion. ${remainingToday} habit${remainingToday === 1 ? '' : 's'} left today to keep it alive.`;
    } else if (consistencyRate >= 80) {
      coachInsight = `Consistency at ${consistencyRate}% this month. ${remainingToday} habit${remainingToday === 1 ? '' : 's'} still open today.`;
    } else {
      coachInsight = `${remainingToday} habit${remainingToday === 1 ? '' : 's'} still to check in today. Small wins compound.`;
    }

    res.json({
      totalHabits: totalHabits || 0,
      totalCheckIns,
      weeklyCheckIns: weeklyCheckIns || 0,
      currentStreak,
      longestStreak,
      consistencyRate,
      expectedCheckIns,
      expectedThisWeek,
      remainingToday,
      coachInsight
    });
  } catch (error: any) {
    console.error('Error fetching habit statistics:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch habit statistics' });
  }
});

// Create a new habit
router.post('/', async (req, res) => {
  try {
    const { userId, name, description, category, icon, color, frequency, frequencyValue, scheduledDays, reminderTime, reminderTone, anchorRoutine, anchorId, cueType, cueTimeStart, cueTimeEnd, behavior, reward, friction, location, linkedGoalId, visibleToTeam, targetDays, startDate, endDate } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'User ID and name are required' });
    }

    const { data: habit, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        name,
        description,
        category: category || 'health',
        icon: icon || 'clock',
        color: color || 'var(--primary)',
        frequency: frequency || 'daily',
        frequency_value: frequencyValue || 1,
        scheduled_days: scheduledDays || [1, 2, 3, 4, 5, 6, 7],
        reminder_time: reminderTime,
        reminder_tone: reminderTone || 'gentle',
        anchor_routine: anchorRoutine,
        anchor_id: anchorId,
        cue_type: cueType || null,
        cue_time_start: cueTimeStart || null,
        cue_time_end: cueTimeEnd || null,
        behavior,
        reward,
        friction,
        location,
        linked_goal_id: linkedGoalId,
        visible_to_team: visibleToTeam || false,
        target_days: targetDays ?? null,
        start_date: startDate || null,
        end_date: endDate || null,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Initialize streak for new habit
    await supabase
      .from('habit_streaks')
      .insert({
        habit_id: habit.id,
        user_id: userId,
        current_streak: 0,
        longest_streak: 0
      });

    res.status(201).json(habit);
  } catch (error: any) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: error.message || 'Failed to create habit' });
  }
});

// Get a single habit with its streak
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .single();

    if (habitError) throw habitError;
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const { data: streak } = await supabase
      .from('habit_streaks')
      .select('*')
      .eq('habit_id', id)
      .single();

    res.json({ ...habit, streak: streak || null });
  } catch (error: any) {
    console.error('Error fetching habit:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch habit' });
  }
});

// Get per-day completion status for a habit over the last N days (default 28)
router.get('/:id/calendar', async (req, res) => {
  try {
    const { id } = req.params;
    const days = Math.min(Math.max(parseInt(String(req.query.days), 10) || 28, 1), 365);

    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const { data: completions, error } = await supabase
      .from('habit_completions')
      .select('completed_at, status')
      .eq('habit_id', id)
      .gte('completed_at', start.toISOString())
      .lte('completed_at', end.toISOString())
      .order('completed_at', { ascending: true });

    if (error) throw error;

    // Fold into one entry per YYYY-MM-DD. If multiple statuses exist for a day,
    // prefer the "best" one (done > partial > skipped).
    const rank: Record<string, number> = { done: 3, partial: 2, skipped: 1 };
    const byDay = new Map<string, string>();
    for (const c of completions || []) {
      const day = new Date(c.completed_at).toISOString().slice(0, 10);
      const prev = byDay.get(day);
      if (!prev || (rank[c.status] || 0) > (rank[prev] || 0)) {
        byDay.set(day, c.status);
      }
    }

    // Emit one entry per day in the range, including days with no completion
    // (status: null) so the frontend calendar can render gaps.
    const calendar: { date: string; status: string | null }[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const day = cursor.toISOString().slice(0, 10);
      calendar.push({ date: day, status: byDay.get(day) || null });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json(calendar);
  } catch (error: any) {
    console.error('Error fetching habit calendar:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch habit calendar' });
  }
});

// Patch a habit (used for pause/resume via is_active, and partial field updates)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, archivedAt } = req.body;

    const update: any = { updated_at: new Date().toISOString() };
    if (typeof isActive === 'boolean') update.is_active = isActive;
    if (archivedAt !== undefined) update.archived_at = archivedAt;
    // Allow any of the editable habit fields to be patched through too.
    const editable = ['name', 'description', 'category', 'icon', 'color', 'frequency', 'frequency_value', 'scheduled_days', 'reminder_time', 'reminder_tone', 'anchor_routine', 'cue_type', 'cue_time_start', 'cue_time_end', 'behavior', 'reward', 'friction', 'location', 'target_days', 'start_date', 'end_date'];
    for (const f of editable) {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    }

    const { data: habit, error } = await supabase
      .from('habits')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(habit);
  } catch (error: any) {
    console.error('Error patching habit:', error);
    res.status(500).json({ error: error.message || 'Failed to patch habit' });
  }
});

// Update a habit
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, icon, color, frequency, frequencyValue, scheduledDays, reminderTime, reminderTone, anchorRoutine, anchorId, cueType, cueTimeStart, cueTimeEnd, behavior, reward, friction, location, linkedGoalId, visibleToTeam, isActive, targetDays, startDate, endDate } = req.body;

    const { data: habit, error } = await supabase
      .from('habits')
      .update({
        name,
        description,
        category,
        icon,
        color,
        frequency,
        frequency_value: frequencyValue,
        scheduled_days: scheduledDays,
        reminder_time: reminderTime,
        reminder_tone: reminderTone,
        anchor_routine: anchorRoutine,
        anchor_id: anchorId,
        cue_type: cueType,
        cue_time_start: cueTimeStart,
        cue_time_end: cueTimeEnd,
        behavior,
        reward,
        friction,
        location,
        linked_goal_id: linkedGoalId,
        visible_to_team: visibleToTeam,
        target_days: targetDays ?? null,
        start_date: startDate || null,
        end_date: endDate || null,
        ...(typeof isActive === 'boolean' ? { is_active: isActive } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(habit);
  } catch (error: any) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: error.message || 'Failed to update habit' });
  }
});

// Delete a habit (soft delete by archiving)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('habits')
      .update({
        is_active: false,
        archived_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: error.message || 'Failed to delete habit' });
  }
});

// Log habit completion
router.post('/completions', async (req, res) => {
  try {
    const { habitId, userId, status, notes } = req.body;
    
    if (!habitId || !userId) {
      return res.status(400).json({ error: 'Habit ID and User ID are required' });
    }

    const completedAt = new Date().toISOString();

    // Create completion record
    const { data: completion, error: completionError } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: habitId,
        user_id: userId,
        completed_at: completedAt,
        status: status || 'done',
        notes
      })
      .select()
      .single();

    if (completionError) throw completionError;

    // Update streak
    const { data: streak } = await supabase
      .from('habit_streaks')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .single();

    if (streak) {
      const newCurrentStreak = streak.current_streak + 1;
      const newLongestStreak = Math.max(streak.longest_streak, newCurrentStreak);

      await supabase
        .from('habit_streaks')
        .update({
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_completed_at: completedAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', streak.id);
    }

    res.status(201).json(completion);
  } catch (error: any) {
    console.error('Error logging habit completion:', error);
    res.status(500).json({ error: error.message || 'Failed to log habit completion' });
  }
});

export { router as habitsRouter }
