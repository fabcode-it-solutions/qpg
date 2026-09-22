import Link from 'next/link'
import React, { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

type ButtonProps = {
  children: React.ReactNode
  as?: 'button' | 'a'
  href?:string
  className?: string
} & (AnchorHTMLAttributes<HTMLAnchorElement> | ButtonHTMLAttributes<HTMLButtonElement>)

const CustomButton = ({
  children,
  as = 'button',
  href,
  className = '',
  ...props
}: ButtonProps) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'

  if (as === 'a') {
    return (
      <Link
      href={href||''}
        className={`${baseClasses} ${className}`}
        {...props as AnchorHTMLAttributes<HTMLAnchorElement>}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={`${baseClasses} ${className}`}
      {...props as ButtonHTMLAttributes<HTMLButtonElement>}
    >
      {children}
    </button>
  )
}

export default CustomButton