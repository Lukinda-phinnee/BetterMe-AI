'use client'

import { useState } from 'react'

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onAddTask: (taskData: any) => Promise<void>
  boardId: string | null
  authToken: string | null
  showColumnField?: boolean
}

export default function AddTaskModal({ isOpen, onClose, onAddTask, boardId, authToken, showColumnField = true }: AddTaskModalProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')
  const [newTaskTag, setNewTaskTag] = useState('Work')
  const [newTaskTagType, setNewTaskTagType] = useState('work')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [newTaskSubtasks, setNewTaskSubtasks] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [newTaskColumn, setNewTaskColumn] = useState('todo')
  const [newTaskColor, setNewTaskColor] = useState('#93c5fd')

  const columnColorRecommendations: Record<string, string> = {
    'todo': '#93c5fd',
    'in-progress': '#fcd34d',
    'review': '#f9a8d4',
    'done': '#86efac'
  }

  const lightColors = [
    '#93c5fd', // medium blue
    '#fcd34d', // medium yellow
    '#f9a8d4', // medium pink
    '#86efac', // medium green
    '#c4b5fd', // medium purple
    '#fca5a5', // medium red
    '#a5b4fc', // indigo
    '#6ee7b7', // emerald
    '#fdba74', // orange
    '#d8b4fe', // violet
  ]

  const handleColumnChange = (column: string) => {
    setNewTaskColumn(column)
    setNewTaskColor(columnColorRecommendations[column] || '#93c5fd')
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !boardId) {
      console.log('Cannot add task: missing title or board ID')
      return
    }
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch('http://localhost:3001/api/cards', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          board_id: boardId,
          title: newTaskTitle,
          description: newTaskDescription,
          due_date: newTaskDue || null,
          priority: newTaskPriority,
          labels: newTaskTag,
          assignees: newTaskAssignee,
          checklist: newTaskSubtasks,
          color: newTaskColor,
          column_status: newTaskColumn
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to create card:', errorText)
        throw new Error(`Failed to create card: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Card created successfully:', data)
      
      // Call parent callback to refresh data
      await onAddTask(data)
      
      // Reset form
      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskDue('')
      setNewTaskTag('Work')
      setNewTaskTagType('work')
      setNewTaskPriority('medium')
      setNewTaskSubtasks('')
      setNewTaskAssignee('')
      setNewTaskColumn('todo')
      setNewTaskColor('#93c5fd')
      onClose()
    } catch (error) {
      console.error('Error creating card:', error)
      alert(`Failed to create card: ${error}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="add-task-form-modal">
      <div 
        className="modal-overlay"
        onClick={onClose}
      />
      <div className="add-task-form">
        <div className="add-task-form-header">
          <h3>Add New Task</h3>
          <button 
            type="button"
            className="add-task-close"
            onClick={onClose}
            aria-label="Close form"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div className="add-task-form-body">
          <div className="form-group">
            <label htmlFor="task-title">Task Title *</label>
            <input
              id="task-title"
              type="text"
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              placeholder="Add more details (optional)"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="form-textarea"
              rows={3}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-due">Due Date</label>
              <input
                id="task-due"
                type="datetime-local"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="task-tag">Category</label>
              <select
                id="task-tag"
                value={newTaskTag}
                onChange={(e) => {
                  const tagMap: Record<string, { tag: string; type: string }> = {
                    'Work': { tag: 'Work', type: 'work' },
                    'Habit': { tag: 'Habit', type: 'health' },
                    'Home': { tag: 'Home', type: 'home' }
                  }
                  setNewTaskTag(e.target.value)
                  setNewTaskTagType(tagMap[e.target.value].type)
                }}
                className="form-select"
              >
                <option value="Work">Work</option>
                <option value="Habit">Habit</option>
                <option value="Home">Home</option>
              </select>
            </div>
          </div>

          {showColumnField && (
            <div className="form-group">
              <label htmlFor="task-column">Column</label>
              <select
                id="task-column"
                value={newTaskColumn}
                onChange={(e) => handleColumnChange(e.target.value)}
                className="form-select"
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="task-color">Card Color</label>
            <div className="color-picker-wrapper">
              <input
                id="task-color"
                type="color"
                value={newTaskColor}
                onChange={(e) => setNewTaskColor(e.target.value)}
                className="color-input"
              />
              <div className="color-presets">
                {lightColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-preset ${newTaskColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTaskColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="form-select"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="task-assignee">Assignee</label>
              <input
                id="task-assignee"
                type="text"
                placeholder="Initials (e.g., AL)"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="task-subtasks">Subtasks</label>
            <input
              id="task-subtasks"
              type="text"
              placeholder="Enter subtasks separated by commas"
              value={newTaskSubtasks}
              onChange={(e) => setNewTaskSubtasks(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
        
        <div className="add-task-form-footer">
          <button 
            type="button"
            className="btn btn-outline"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button"
            className="btn btn-solid"
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim()}
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  )
}
