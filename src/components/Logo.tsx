/**
 * IntellivexLogo — renders the real logo SVG.
 * Props:
 *   size      — px dimension of the containing box (default 24)
 *   colored   — if true, wraps in a green gradient box (default false)
 *   className — forwarded to outer element
 */
interface LogoProps {
  size?: number
  colored?: boolean
  className?: string
}

export function IntellivexLogo({ size = 24, colored = false, className = '' }: LogoProps) {
  // Map pixel sizes to discrete classes to avoid inline styles
  let sizeClass = 'logo-sm'
  if (size <= 15) sizeClass = 'logo-xs'
  else if (size <= 24) sizeClass = 'logo-sm'
  else if (size <= 64) sizeClass = 'logo-md'
  else if (size <= 100) sizeClass = 'logo-lg'
  else if (size <= 120) sizeClass = 'logo-xl'
  else sizeClass = 'logo-xxl'

  const img = (
    <img
      src="/logo-white.svg"
      alt="Intellivex AI"
      width={size}
      height={size}
      className={`logo-img ${!colored ? className : ''}`}
      draggable={false}
    />
  )

  if (!colored) return img

  return (
    <div className={`logo-box ${sizeClass} ${className}`}>
      {img}
    </div>
  )
}
