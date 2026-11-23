import { createContext, useContext } from 'react';

export type Appearance = 'light' | 'dark';
export const ThemeContext = createContext<{ appearance: Appearance; toggle: () => void }>({
  appearance: 'light',
  toggle: () => {},
});

export function useAppearance() {
  return useContext(ThemeContext);
}
