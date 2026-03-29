export interface Theme {
  name: string;
  label: string;
  isDark: boolean;
  colors: {
    bg: string;
    main: string;
    caret: string;
    sub: string;
    subAlt: string;
    text: string;
    error: string;
    errorExtra: string;
  };
}

export const themes: Theme[] = [
  {
    name: 'serika_dark',
    label: 'Serika Dark',
    isDark: true,
    colors: {
      bg: '#323437',
      main: '#e2b714',
      caret: '#e2b714',
      sub: '#646669',
      subAlt: '#2c2e31',
      text: '#d1d0c5',
      error: '#ca4754',
      errorExtra: '#7e2a33',
    },
  },
  {
    name: 'serika',
    label: 'Serika',
    isDark: false,
    colors: {
      bg: '#e1e1e3',
      main: '#e2b714',
      caret: '#e2b714',
      sub: '#aaaeb3',
      subAlt: '#d1d3d7',
      text: '#323437',
      error: '#ca4754',
      errorExtra: '#7e2a33',
    },
  },
  {
    name: 'dracula',
    label: 'Dracula',
    isDark: true,
    colors: {
      bg: '#282a36',
      main: '#bd93f9',
      caret: '#f8f8f2',
      sub: '#6272a4',
      subAlt: '#20222c',
      text: '#f8f8f2',
      error: '#ff5555',
      errorExtra: '#cc4444',
    },
  },
  {
    name: 'monokai',
    label: 'Monokai',
    isDark: true,
    colors: {
      bg: '#272822',
      main: '#fd971f',
      caret: '#f8f8f2',
      sub: '#75715e',
      subAlt: '#1f201b',
      text: '#f8f8f2',
      error: '#f92672',
      errorExtra: '#c41a5a',
    },
  },
  {
    name: 'nord',
    label: 'Nord',
    isDark: true,
    colors: {
      bg: '#2e3440',
      main: '#88c0d0',
      caret: '#eceff4',
      sub: '#4c566a',
      subAlt: '#272c36',
      text: '#eceff4',
      error: '#bf616a',
      errorExtra: '#994e55',
    },
  },
  {
    name: 'botanical',
    label: 'Botanical',
    isDark: false,
    colors: {
      bg: '#7b9c98',
      main: '#eaf1de',
      caret: '#eaf1de',
      sub: '#495755',
      subAlt: '#6d8e8a',
      text: '#eaf1de',
      error: '#c75d5d',
      errorExtra: '#a14a4a',
    },
  },
  {
    name: 'carbon',
    label: 'Carbon',
    isDark: true,
    colors: {
      bg: '#313131',
      main: '#f66e0d',
      caret: '#f66e0d',
      sub: '#6b6b6b',
      subAlt: '#2a2a2a',
      text: '#f5e6c8',
      error: '#c75d5d',
      errorExtra: '#a14a4a',
    },
  },
  {
    name: 'midnight',
    label: 'Midnight',
    isDark: true,
    colors: {
      bg: '#0b0e13',
      main: '#67a2f4',
      caret: '#67a2f4',
      sub: '#3a3f4b',
      subAlt: '#070a0e',
      text: '#cccccc',
      error: '#e74c3c',
      errorExtra: '#b93d30',
    },
  },
];

export const defaultTheme = 'serika_dark';

export function getTheme(name: string): Theme {
  return themes.find((t) => t.name === name) ?? themes[0];
}
