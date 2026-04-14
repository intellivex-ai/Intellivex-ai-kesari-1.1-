import * as React from 'react'

declare module 'react-live' {
  export interface LiveProviderProps {
    children?: React.ReactNode
    code?: string
    noInline?: boolean
    scope?: { [key: string]: any }
    theme?: any
    language?: string
    disabled?: boolean
    transformCode?: (code: string) => string | Promise<string>
  }

  export const LiveProvider: React.ComponentType<LiveProviderProps>
  export const LivePreview: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
  export const LiveError: React.ComponentType<React.HTMLAttributes<HTMLDivElement>>
  export const LiveEditor: React.ComponentType<any>
}
