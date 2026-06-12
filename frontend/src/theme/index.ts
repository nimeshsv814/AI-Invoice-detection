import { createTheme, alpha } from '@mui/material/styles';

const BRAND = {
  primary:   '#6366f1', // Indigo
  secondary: '#8b5cf6', // Violet
  success:   '#10b981', // Emerald
  warning:   '#f59e0b', // Amber
  error:     '#ef4444', // Red
  info:      '#3b82f6', // Blue
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: BRAND.primary,   light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: BRAND.secondary, light: '#a78bfa', dark: '#7c3aed' },
    success:   { main: BRAND.success },
    warning:   { main: BRAND.warning },
    error:     { main: BRAND.error },
    info:      { main: BRAND.info },
    background: {
      default: '#0a0a14',
      paper:   '#0f0f1e',
    },
    text: {
      primary:   '#f1f5f9',
      secondary: '#94a3b8',
    },
    divider: 'rgba(148,163,184,0.08)',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, lineHeight: 1.5 },
    body1: { lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,.5)',
    '0 2px 4px -1px rgba(0,0,0,.5)',
    '0 4px 6px -2px rgba(0,0,0,.5)',
    '0 6px 10px -3px rgba(0,0,0,.5)',
    '0 10px 15px -4px rgba(0,0,0,.5)',
    '0 12px 20px -5px rgba(0,0,0,.5)',
    '0 14px 25px -5px rgba(0,0,0,.5)',
    '0 16px 30px -6px rgba(0,0,0,.5)',
    '0 18px 35px -7px rgba(0,0,0,.5)',
    '0 20px 40px -8px rgba(0,0,0,.5)',
    '0 22px 45px -9px rgba(0,0,0,.5)',
    '0 24px 50px -10px rgba(0,0,0,.5)',
    '0 26px 55px -11px rgba(0,0,0,.5)',
    '0 28px 60px -12px rgba(0,0,0,.5)',
    '0 30px 65px -13px rgba(0,0,0,.5)',
    '0 32px 70px -14px rgba(0,0,0,.5)',
    '0 34px 75px -15px rgba(0,0,0,.5)',
    '0 36px 80px -16px rgba(0,0,0,.5)',
    '0 38px 85px -17px rgba(0,0,0,.5)',
    '0 40px 90px -18px rgba(0,0,0,.5)',
    '0 42px 95px -19px rgba(0,0,0,.5)',
    '0 44px 100px -20px rgba(0,0,0,.5)',
    '0 46px 105px -21px rgba(0,0,0,.5)',
    '0 48px 110px -22px rgba(0,0,0,.5)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        html: { scrollBehavior: 'smooth' },
        body: { scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' },
        '::-webkit-scrollbar': { width: '6px', height: '6px' },
        '::-webkit-scrollbar-thumb': { backgroundColor: '#334155', borderRadius: '3px' },
        '::-webkit-scrollbar-track': { background: 'transparent' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0f0f1e',
          border: '1px solid rgba(148,163,184,0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0f0f1e',
          border: '1px solid rgba(148,163,184,0.08)',
          transition: 'border-color .2s, box-shadow .2s',
          '&:hover': { borderColor: 'rgba(99,102,241,0.3)', boxShadow: `0 0 0 1px rgba(99,102,241,0.15)` },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
        contained: {
          background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%)`,
          boxShadow: `0 4px 15px ${alpha(BRAND.primary, 0.35)}`,
          '&:hover': { boxShadow: `0 6px 20px ${alpha(BRAND.primary, 0.5)}` },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid rgba(148,163,184,0.08)' },
        head: { fontWeight: 600, color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 6, height: 6 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: '#080812', border: 'none', borderRight: '1px solid rgba(148,163,184,0.06)' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(148,163,184,0.08)', boxShadow: 'none' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(148,163,184,0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(99,102,241,0.4)' },
            '&.Mui-focused fieldset': { borderColor: BRAND.primary },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#1e1e35', border: '1px solid rgba(148,163,184,0.12)', fontSize: '0.75rem' },
      },
    },
  },
});

export default theme;
export { BRAND };
