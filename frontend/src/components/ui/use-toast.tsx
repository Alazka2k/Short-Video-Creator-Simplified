"use client"

import * as React from "react"

interface ToastProps {
  title: string
  description: string
  variant?: 'default' | 'destructive'
}

interface UseToast {
  toast: (props: ToastProps) => void
}

export const useToast = (): UseToast => {
  return {
    toast: ({ title, description, variant = 'default' }) => {
      console.log({ title, description, variant })
    }
  }
} 