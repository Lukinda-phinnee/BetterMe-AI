import React from 'react'
import { cn } from '../utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn('border rounded-lg p-4 bg-white shadow-sm', className)}
      {...props}
    />
  )
}
