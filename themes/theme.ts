export type ThemeMode = 'light' | 'dark';
export type ThemeName = 'default' | 'cyberpunk' | 'sololeveling' | 'japanese' | 'custom';

export interface ThemeColors {
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

export const THEME_MAP: Record<ThemeName, Record<ThemeMode, ThemeColors>> = {
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
      headerBg: 'bg-slate-950',
      cardBg: 'bg-slate-900',
      inputBg: 'bg-slate-800',
      textPrimary: 'text-slate-50',
      textSecondary: 'text-slate-400',
      accent: 'bg-indigo-500',
      border: 'border-slate-800'
    }
  },
  cyberpunk: {
    light: {
      mainBg: 'bg-fuchsia-50',
      sidebarBg: 'bg-slate-900',
      headerBg: 'bg-white',
      cardBg: 'bg-white',
      inputBg: 'bg-fuchsia-100',
      textPrimary: 'text-fuchsia-950',
      textSecondary: 'text-fuchsia-600',
      accent: 'bg-fuchsia-600',
      border: 'border-fuchsia-200'
    },
    dark: {
      mainBg: 'bg-black',
      sidebarBg: 'bg-zinc-950',
      headerBg: 'bg-black',
      cardBg: 'bg-zinc-900',
      inputBg: 'bg-zinc-800',
      textPrimary: 'text-fuchsia-400',
      textSecondary: 'text-zinc-500',
      accent: 'bg-fuchsia-500',
      border: 'border-fuchsia-500/30'
    }
  },
  sololeveling: {
    light: {
      mainBg: 'bg-blue-50',
      sidebarBg: 'bg-slate-900',
      headerBg: 'bg-white',
      cardBg: 'bg-white',
      inputBg: 'bg-blue-100',
      textPrimary: 'text-blue-950',
      textSecondary: 'text-blue-600',
      accent: 'bg-blue-600',
      border: 'border-blue-200'
    },
    dark: {
      mainBg: 'bg-slate-950',
      sidebarBg: 'bg-slate-900',
      headerBg: 'bg-slate-950',
      cardBg: 'bg-slate-900',
      inputBg: 'bg-slate-800',
      textPrimary: 'text-blue-400',
      textSecondary: 'text-slate-400',
      accent: 'bg-blue-500',
      border: 'border-blue-500/20'
    }
  },
  japanese: {
    light: {
      mainBg: 'bg-stone-50',
      sidebarBg: 'bg-stone-900',
      headerBg: 'bg-white',
      cardBg: 'bg-white',
      inputBg: 'bg-stone-100',
      textPrimary: 'text-stone-950',
      textSecondary: 'text-stone-600',
      accent: 'bg-red-600',
      border: 'border-stone-200'
    },
    dark: {
      mainBg: 'bg-stone-950',
      sidebarBg: 'bg-stone-900',
      headerBg: 'bg-stone-950',
      cardBg: 'bg-stone-900',
      inputBg: 'bg-stone-800',
      textPrimary: 'text-stone-200',
      textSecondary: 'text-stone-400',
      accent: 'bg-red-700',
      border: 'border-stone-800'
    }
  },
  custom: {
    light: {
      mainBg: 'bg-emerald-50',
      sidebarBg: 'bg-emerald-900',
      headerBg: 'bg-white',
      cardBg: 'bg-white',
      inputBg: 'bg-emerald-100',
      textPrimary: 'text-emerald-950',
      textSecondary: 'text-emerald-600',
      accent: 'bg-emerald-600',
      border: 'border-emerald-200'
    },
    dark: {
      mainBg: 'bg-emerald-950',
      sidebarBg: 'bg-emerald-900',
      headerBg: 'bg-emerald-950',
      cardBg: 'bg-emerald-900',
      inputBg: 'bg-emerald-800',
      textPrimary: 'text-emerald-50',
      textSecondary: 'text-emerald-400',
      accent: 'bg-emerald-500',
      border: 'border-emerald-800'
    }
  }
};