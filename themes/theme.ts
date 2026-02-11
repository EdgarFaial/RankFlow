
export type ThemeMode = 'light' | 'dark';
export type ThemeName = 'default' | 'cyberpunk' | 'sololeveling' | 'japanese' | 'custom';

export interface ThemeConfig {
  name: ThemeName;
  mode: ThemeMode;
}

export interface ThemeColors {
  mainBg: string;
  sidebarBg: string;
  cardBg: string;
  headerBg: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentHover: string;
  inputBg: string;
  bgImage?: string; // Support for background images
  bgOpacity?: number; // Background overlay opacity
}

export const THEME_MAP: Record<Exclude<ThemeName, 'custom'>, Record<ThemeMode, ThemeColors>> = {
  default: {
    light: {
      mainBg: 'bg-slate-50',
      sidebarBg: 'bg-slate-900',
      cardBg: 'bg-white',
      headerBg: 'bg-white',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-500',
      border: 'border-slate-200',
      accent: 'bg-indigo-600',
      accentHover: 'hover:bg-indigo-700',
      inputBg: 'bg-white',
    },
    dark: {
      mainBg: 'bg-slate-950',
      sidebarBg: 'bg-slate-900',
      cardBg: 'bg-slate-900',
      headerBg: 'bg-slate-900',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-400',
      border: 'border-slate-800',
      accent: 'bg-indigo-500',
      accentHover: 'hover:bg-indigo-600',
      inputBg: 'bg-slate-950',
    }
  },
  cyberpunk: {
    light: {
      mainBg: 'bg-yellow-50',
      sidebarBg: 'bg-slate-950',
      cardBg: 'bg-white',
      headerBg: 'bg-white',
      textPrimary: 'text-black',
      textSecondary: 'text-slate-600',
      border: 'border-cyan-400',
      accent: 'bg-fuchsia-600',
      accentHover: 'hover:bg-fuchsia-700',
      inputBg: 'bg-yellow-50/50',
    },
    dark: {
      mainBg: 'bg-black',
      sidebarBg: 'bg-black',
      cardBg: 'bg-slate-950',
      headerBg: 'bg-slate-950',
      textPrimary: 'text-cyan-400',
      textSecondary: 'text-fuchsia-400',
      border: 'border-fuchsia-500',
      accent: 'bg-cyan-500',
      accentHover: 'hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]',
      inputBg: 'bg-black',
    }
  },
  sololeveling: {
    light: {
      mainBg: 'bg-blue-50',
      sidebarBg: 'bg-blue-950',
      cardBg: 'bg-white',
      headerBg: 'bg-white',
      textPrimary: 'text-blue-950',
      textSecondary: 'text-blue-700',
      border: 'border-blue-200',
      accent: 'bg-blue-600',
      accentHover: 'hover:bg-blue-700',
      inputBg: 'bg-white',
    },
    dark: {
      mainBg: 'bg-[#020617]',
      sidebarBg: 'bg-[#0f172a]',
      cardBg: 'bg-[#1e293b]',
      headerBg: 'bg-[#0f172a]',
      textPrimary: 'text-white',
      textSecondary: 'text-blue-400',
      border: 'border-blue-500/30',
      accent: 'bg-blue-500',
      accentHover: 'hover:bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]',
      inputBg: 'bg-[#020617]',
    }
  },
  japanese: {
    light: {
      mainBg: 'bg-[#F9F4E8]',
      sidebarBg: 'bg-[#2C3E50]',
      cardBg: 'bg-white',
      headerBg: 'bg-white',
      textPrimary: 'text-[#2C3E50]',
      textSecondary: 'text-slate-600',
      border: 'border-[#E67E22]/30',
      accent: 'bg-[#C0392B]',
      accentHover: 'hover:bg-[#A93226]',
      inputBg: 'bg-white',
    },
    dark: {
      mainBg: 'bg-[#1A1A1A]',
      sidebarBg: 'bg-[#0A0A0A]',
      cardBg: 'bg-[#262626]',
      headerBg: 'bg-[#0A0A0A]',
      textPrimary: 'text-[#E0E0E0]',
      textSecondary: 'text-[#C0392B]',
      border: 'border-[#C0392B]/50',
      accent: 'bg-[#C0392B]',
      accentHover: 'hover:bg-[#E74C3C]',
      inputBg: 'bg-[#1A1A1A]',
    }
  }
};
