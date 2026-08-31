export interface NavigationItem {
  to: string
  label: string
  shortLabel: string
  icon: string
}

export const navigationItems: readonly NavigationItem[] = [
  { to: '/', label: 'หน้าหลัก', shortLabel: 'หน้าหลัก', icon: '⌂' },
  { to: '/work', label: 'งาน', shortLabel: 'งาน', icon: '✓' },
  { to: '/scan', label: 'สแกน', shortLabel: 'สแกน', icon: '⌗' },
  { to: '/trees', label: 'ต้นไม้', shortLabel: 'ต้นไม้', icon: '♧' },
  { to: '/more', label: 'เพิ่มเติม', shortLabel: 'เพิ่มเติม', icon: '•••' },
] as const
