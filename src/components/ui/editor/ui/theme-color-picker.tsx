'use client'

import { cn } from '@/lib/utils'

interface ThemeColor {
  value: string
  label: string
}

// Tailwind/shadcn-compatible colors that work in light and dark mode
// Using CSS custom properties for theme compatibility
// Note: In Tailwind v4 with @theme, variables are defined as --color-*
const themeColors: ThemeColor[] = [
  // Row 1: Theme neutrals (using actual Tailwind v4 variable names)
  { value: 'var(--color-background)', label: 'Background' },
  { value: 'var(--color-muted)', label: 'Muted' },
  { value: 'var(--color-accent)', label: 'Accent' },
  { value: 'var(--color-secondary)', label: 'Secondary' },
  { value: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', label: 'Primary Light' },
  // Row 2: Semantic colors (light variants)
  { value: 'hsl(0 84% 60% / 0.15)', label: 'Red Light' },
  { value: 'hsl(25 95% 53% / 0.15)', label: 'Orange Light' },
  { value: 'hsl(48 96% 53% / 0.15)', label: 'Yellow Light' },
  { value: 'hsl(142 71% 45% / 0.15)', label: 'Green Light' },
  { value: 'hsl(199 89% 48% / 0.15)', label: 'Blue Light' },
  // Row 3: Semantic colors (medium variants)
  { value: 'hsl(0 84% 60% / 0.25)', label: 'Red' },
  { value: 'hsl(25 95% 53% / 0.25)', label: 'Orange' },
  { value: 'hsl(48 96% 53% / 0.25)', label: 'Yellow' },
  { value: 'hsl(142 71% 45% / 0.25)', label: 'Green' },
  { value: 'hsl(199 89% 48% / 0.25)', label: 'Blue' },
  // Row 4: Purple/Pink tones
  { value: 'hsl(262 83% 58% / 0.15)', label: 'Purple Light' },
  { value: 'hsl(262 83% 58% / 0.25)', label: 'Purple' },
  { value: 'hsl(330 81% 60% / 0.15)', label: 'Pink Light' },
  { value: 'hsl(330 81% 60% / 0.25)', label: 'Pink' },
  { value: 'hsl(172 66% 50% / 0.25)', label: 'Teal' },
]

// Text colors for font color picker - these need to be more opaque for readability
const textColors: ThemeColor[] = [
  // Row 1: Theme colors
  { value: 'var(--color-foreground)', label: 'Default' },
  { value: 'var(--color-muted-foreground)', label: 'Muted' },
  { value: 'var(--color-primary)', label: 'Primary' },
  { value: 'var(--color-secondary-foreground)', label: 'Secondary' },
  { value: 'var(--color-destructive)', label: 'Destructive' },
  // Row 2: Semantic colors
  { value: 'hsl(0 84% 40%)', label: 'Red' },
  { value: 'hsl(25 95% 40%)', label: 'Orange' },
  { value: 'hsl(48 96% 35%)', label: 'Yellow' },
  { value: 'hsl(142 71% 35%)', label: 'Green' },
  { value: 'hsl(199 89% 40%)', label: 'Blue' },
  // Row 3: More semantic colors
  { value: 'hsl(262 83% 50%)', label: 'Purple' },
  { value: 'hsl(330 81% 50%)', label: 'Pink' },
  { value: 'hsl(172 66% 40%)', label: 'Teal' },
  { value: 'hsl(0 0% 0%)', label: 'Black' },
  { value: 'hsl(0 0% 50%)', label: 'Gray' },
]

interface ThemeColorPickerProps {
  color?: string
  onChange: (color: string) => void
  onClose?: () => void
  showClearButton?: boolean
  mode?: 'background' | 'text'
  className?: string
}

export function ThemeColorPicker({
  color,
  onChange,
  onClose,
  showClearButton = true,
  mode = 'background',
  className,
}: ThemeColorPickerProps) {
  const colors = mode === 'text' ? textColors : themeColors

  const handleColorClick = (colorValue: string) => {
    onChange(colorValue)
    onClose?.()
  }

  return (
    <div className={cn('p-2', className)}>
      <div className="grid grid-cols-5 gap-1">
        {colors.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            className={cn(
              'w-6 h-6 rounded border border-border hover:scale-110 transition-transform',
              color === c.value && 'ring-2 ring-ring ring-offset-1'
            )}
            style={{ backgroundColor: c.value }}
            onClick={() => handleColorClick(c.value)}
          />
        ))}
      </div>
      {showClearButton && (
        <button
          type="button"
          className="w-full mt-2 px-2 py-1 text-sm text-muted-foreground hover:bg-accent rounded"
          onClick={() => {
            onChange('')
            onClose?.()
          }}
        >
          Clear color
        </button>
      )}
    </div>
  )
}

export { themeColors, textColors }
export type { ThemeColor }
