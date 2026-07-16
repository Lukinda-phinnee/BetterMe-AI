import React from 'react'
import { cn } from '../utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  ...props
}) => {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-colors',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'bg-transparent text-gray-700 hover:bg-gray-100': variant === 'ghost',
        },
        className
      )}
      {...props}
    />
  )
}
