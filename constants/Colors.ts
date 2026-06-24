/**
 * Doğa temalı premium renk paleti
 * Emerald Green tonları ile elegant dark theme
 */
export const Colors = {
  // Primary - Emerald Green
  primary: '#059669',
  primaryLight: '#34D399',
  primaryDark: '#047857',
  primarySoft: '#D1FAE5',
  primaryMuted: 'rgba(5, 150, 105, 0.15)',

  // Accent - Soft Mint
  accent: '#6EE7B7',
  accentGlow: '#A7F3D0',

  // Background (Dark elegant theme)
  bgPrimary: '#0F172A',
  bgSecondary: '#1E293B',
  bgTertiary: '#334155',
  bgCard: 'rgba(30, 41, 59, 0.85)',
  bgGlass: 'rgba(30, 41, 59, 0.6)',
  bgInput: 'rgba(51, 65, 85, 0.5)',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',

  // Status Colors
  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.15)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',
  infoSoft: 'rgba(59, 130, 246, 0.15)',

  // Borders
  border: 'rgba(148, 163, 184, 0.15)',
  borderLight: 'rgba(148, 163, 184, 0.08)',
  borderFocus: '#059669',

  // Shadows
  shadowColor: '#000000',

  // Gradient Pairs
  gradientPrimary: ['#059669', '#34D399'] as const,
  gradientDark: ['#0F172A', '#1E293B'] as const,
  gradientCard: ['rgba(30,41,59,0.95)', 'rgba(15,23,42,0.98)'] as const,
  gradientHero: ['#047857', '#059669', '#34D399'] as const,
  gradientDanger: ['#DC2626', '#EF4444'] as const,

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};
