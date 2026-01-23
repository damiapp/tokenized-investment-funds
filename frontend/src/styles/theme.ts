// Microsoft Copilot-inspired color theme
export const theme = {
  // Background colors
  background: {
    primary: '#1e1e1e',      // Main background (dark)
    secondary: '#2d2d2d',    // Card/panel background
    tertiary: '#3a3a3a',     // Hover states
    elevated: '#252526',     // Elevated elements
  },
  
  // Border colors
  border: {
    default: '#3e3e42',      // Default borders
    subtle: '#2d2d2d',       // Subtle borders
    focus: '#0078d4',        // Focus/active borders
  },
  
  // Text colors
  text: {
    primary: '#ffffff',      // Primary text
    secondary: '#cccccc',    // Secondary text
    tertiary: '#9d9d9d',     // Muted text
    disabled: '#6e6e6e',     // Disabled text
  },
  
  // Accent colors
  accent: {
    primary: '#0078d4',      // Primary blue (Copilot blue)
    primaryHover: '#106ebe', // Primary hover
    success: '#107c10',      // Success green
    warning: '#ffc83d',      // Warning yellow
    error: '#e81123',        // Error red
    info: '#00bcf2',         // Info cyan
  },
  
  // Status colors
  status: {
    confirmed: '#107c10',    // Green
    pending: '#ffc83d',      // Yellow
    cancelled: '#e81123',    // Red
    active: '#0078d4',       // Blue
  },
  
  // Risk level colors
  risk: {
    low: '#107c10',          // Green
    medium: '#ffc83d',       // Yellow
    high: '#e81123',         // Red
  },
  
  // Button colors
  button: {
    primary: '#0078d4',
    primaryHover: '#106ebe',
    secondary: '#3a3a3a',
    secondaryHover: '#4a4a4a',
    danger: '#e81123',
    dangerHover: '#c50f1f',
  },
  
  // Typography
  font: {
    family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    size: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '32px',
      '5xl': '48px',
    },
    weight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  
  // Border radius
  radius: {
    sm: '2px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    full: '9999px',
  },
  
  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 2px 4px rgba(0, 0, 0, 0.4)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.5)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.6)',
  },
};

export type Theme = typeof theme;
