
export type ThemeMode = 'light' | 'dark';
export type ThemeName = 'default' | 'cyberpunk' | 'sololeveling' | 'japanese';

export interface ThemeConfig {
  mainBg: string;
  sidebarBg: string;
  headerBg: string;
  cardBg: string;
  inputBg: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
  bgImage?: string;
  bgOpacity?: number;
}

export const THEME_MAP: Record<ThemeName, Record<ThemeMode, ThemeConfig>> = {
  default: {
    light: {
      mainBg: 'bg-slate-50',
      sidebarBg: 'bg-slate-900',
      headerBg: 'bg-white',
      cardBg: 'bg-white',
      inputBg: 'bg-slate-100',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-500',
      accent: 'bg-indigo-600',
      border: 'border-slate-200'
    },
    dark: {
      mainBg: 'bg-slate-950',
      sidebarBg: 'bg-slate-900',
      headerBg: 'bg-slate-900',
      cardBg: 'bg-slate-900',
      inputBg: 'bg-slate-800',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-400',
      accent: 'bg-indigo-500',
      border: 'border-slate-800'
    }
  },
  cyberpunk: {
    light: {
      mainBg: 'bg-fuchsia-50',
      sidebarBg: 'bg-slate-950',
      headerBg: 'bg-white',
      cardBg: 'bg-white',
      inputBg: 'bg-fuchsia-100/50',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-500',
      accent: 'bg-fuchsia-600',
      border: 'border-fuchsia-200'
    },
    dark: {
      mainBg: 'bg-black',
      sidebarBg: 'bg-black',
      headerBg: 'bg-slate-950',
      cardBg: 'bg-slate-950',
      inputBg: 'bg-slate-900',
      textPrimary: 'text-fuchsia-500',
      textSecondary: 'text-cyan-400',
      accent: 'bg-fuchsia-500',
      border: 'border-fuchsia-500/30',
      bgOpacity: 0.15
    }
  },
  sololeveling: {
    light: {
      mainBg: 'bg-blue-50',
      sidebarBg: 'bg-blue-950',
      headerBg: 'bg-white',
      cardBg: 'bg-white',
      inputBg: 'bg-blue-100/50',
      textPrimary: 'text-blue-900',
      textSecondary: 'text-blue-500',
      accent: 'bg-blue-600',
      border: 'border-blue-200'
    },
    dark: {
      mainBg: 'bg-[#0a0b1e]',
      sidebarBg: 'bg-[#050614]',
      headerBg: 'bg-[#0d0e2d]',
      cardBg: 'bg-[#0d0e2d]',
      inputBg: 'bg-[#1a1b3a]',
      textPrimary: 'text-blue-400',
      textSecondary: 'text-slate-400',
      accent: 'bg-blue-600',
      border: 'border-blue-500/20'
    }
  },
  japanese: {
    light: {
      mainBg: 'bg-[#f4f1ea]',
      sidebarBg: 'bg-[#3c3c3c]',
      headerBg: 'bg-white',
      cardBg: 'bg-white',
      inputBg: 'bg-[#efede8]',
      textPrimary: 'text-[#2d2d2d]',
      textSecondary: 'text-[#6b6b6b]',
      accent: 'bg-[#d64933]',
      border: 'border-[#e0ddd5]'
    },
    dark: {
      mainBg: 'bg-[#1a1a1a]',
      sidebarBg: 'bg-[#141414]',
      headerBg: 'bg-[#242424]',
      cardBg: 'bg-[#242424]',
      inputBg: 'bg-[#2d2d2d]',
      textPrimary: 'text-[#e0ddd5]',
      textSecondary: 'text-[#8c8c8c]',
      accent: 'bg-[#d64933]',
      border: 'border-[#333333]'
    }
  }
};
