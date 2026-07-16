'use client'

import { useState } from 'react'

export default function AnalyticsPage() {
  const [timePeriod] = useState('Last 30 Days')

  const cycleTimeData = [
    { name: 'Goal Decomposition', avg: '1.2 days', min: '0.5 days', max: '3 days' },
    { name: 'Routine Completion', avg: '0.8 days', min: '0.2 days', max: '2 days' },
    { name: 'Deep Work Tasks', avg: '4.5 days', min: '1.0 day', max: '14 days' }
  ]

  return (
    <div className="screen-content" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>📊 Cycle Time & Work Flow</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
            Measure team bottlenecking, cycle times, and task completion speed.
          </p>
        </div>
        <select
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1.5px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          value={timePeriod}
          disabled
        >
          <option>Last 30 Days</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Metric Card 1 */}
        <div className="card" style={{ padding: '20px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>AVG. CYCLE TIME</span>
          <div style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0', color: 'var(--ink)' }}>2.1 Days</div>
          <p style={{ fontSize: '12px', color: 'var(--success, #10B981)', fontWeight: 600 }}>
            ↓ 14% improvement vs last month
          </p>
        </div>

        {/* Metric Card 2 */}
        <div className="card" style={{ padding: '20px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>WIP THROUGHPUT</span>
          <div style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0', color: 'var(--ink)' }}>18 Tasks/wk</div>
          <p style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
            Aligns with target capacity limits
          </p>
        </div>

        {/* Metric Card 3 */}
        <div className="card" style={{ padding: '20px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>COACHING NUDGE IMPACT</span>
          <div style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0', color: 'var(--ink)' }}>92%</div>
          <p style={{ fontSize: '12px', color: 'var(--success, #10B981)', fontWeight: 600 }}>
            Follow-through completion rate
          </p>
        </div>
      </div>

      {/* SVG Cumulative Flow Representation */}
      <div className="card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--ink)' }}>
          Cumulative Flow & Task Burndown (Kanban Model)
        </h3>
        <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', position: 'relative' }}>
          {/* Simple Visual representation using bars representing Done, In-Progress, Todo stacked */}
          {[60, 68, 75, 82, 90, 95, 100].map((total, idx) => {
            const doneHeight = total * 0.6
            const ipHeight = total * 0.25
            const todoHeight = total * 0.15
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', height: '100%', gap: '2px' }}>
                <div style={{ height: `${doneHeight}%`, background: 'rgba(16, 185, 129, 0.7)', borderRadius: '4px' }} title="Done" />
                <div style={{ height: `${ipHeight}%`, background: 'rgba(99, 102, 241, 0.7)', borderRadius: '4px' }} title="In Progress" />
                <div style={{ height: `${todoHeight}%`, background: 'rgba(107, 114, 128, 0.3)', borderRadius: '4px' }} title="Todo" />
                <span style={{ fontSize: '9px', color: 'var(--muted)', textAlign: 'center', marginTop: '4px', fontWeight: 700 }}>
                  W{idx + 1}
                </span>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-soft)' }}>
            <span style={{ width: '10px', height: '10px', background: 'rgba(16, 185, 129, 0.7)', borderRadius: '2px' }} /> Done
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-soft)' }}>
            <span style={{ width: '10px', height: '10px', background: 'rgba(99, 102, 241, 0.7)', borderRadius: '2px' }} /> In Progress
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-soft)' }}>
            <span style={{ width: '10px', height: '10px', background: 'rgba(107, 114, 128, 0.3)', borderRadius: '2px' }} /> Todo
          </div>
        </div>
      </div>

      {/* Cycle Time Table */}
      <div className="card" style={{ padding: '24px', borderRadius: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--ink)' }}>
          Cycle Time details by Task Type
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', color: 'var(--ink-soft)' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', fontWeight: 700 }}>Task Category</th>
                <th style={{ padding: '12px 8px', fontWeight: 700 }}>Average Cycle</th>
                <th style={{ padding: '12px 8px', fontWeight: 700 }}>Min Cycle</th>
                <th style={{ padding: '12px 8px', fontWeight: 700 }}>Max Cycle</th>
              </tr>
            </thead>
            <tbody>
              {cycleTimeData.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>{row.name}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--primary)', fontWeight: 700 }}>{row.avg}</td>
                  <td style={{ padding: '12px 8px' }}>{row.min}</td>
                  <td style={{ padding: '12px 8px' }}>{row.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
