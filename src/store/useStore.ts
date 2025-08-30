import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // UI state
  showFilters: boolean;
  currentPropertyIndex: number;
  
  // Actions
  toggleFilters: () => void;
  setCurrentPropertyIndex: (index: number) => void;
  nextProperty: () => void;
  resetPropertyIndex: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      showFilters: false,
      currentPropertyIndex: 0,

      // Actions
      toggleFilters: () => set(state => ({ showFilters: !state.showFilters })),
      setCurrentPropertyIndex: (index) => set({ currentPropertyIndex: index }),
      nextProperty: () => set(state => ({ currentPropertyIndex: state.currentPropertyIndex + 1 })),
      resetPropertyIndex: () => set({ currentPropertyIndex: 0 })
    }),
    {
      name: 'rentsnap-store',
      partialize: (state) => ({
        currentPropertyIndex: state.currentPropertyIndex
      })
    }
  )
);