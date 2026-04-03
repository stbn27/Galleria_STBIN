import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';
type ViewMode = 'grid' | 'carousel';

interface UiState {
  theme: Theme;
  viewMode: ViewMode;
  activeModal: string | null;
  activeViewerId: string | null;
  selectedMediaIds: string[];
  isJobsPanelOpen: boolean;
  isLogsPanelOpen: boolean;
  isSidebarCollapsed: boolean;

  toggleTheme: () => void;
  setViewMode: (mode: ViewMode) => void;
  openModal: (name: string) => void;
  closeModal: () => void;
  openViewer: (id: string) => void;
  closeViewer: () => void;
  selectMedia: (id: string) => void;
  deselectMedia: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
  toggleJobsPanel: () => void;
  toggleLogsPanel: () => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'dark',
      viewMode: 'grid',
      activeModal: null,
      activeViewerId: null,
      selectedMediaIds: [],
      isJobsPanelOpen: false,
      isLogsPanelOpen: false,
      isSidebarCollapsed: false,

      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setViewMode: (mode) => set({ viewMode: mode }),
      openModal: (name) => set({ activeModal: name }),
      closeModal: () => set({ activeModal: null }),
      openViewer: (id) => set({ activeViewerId: id }),
      closeViewer: () => set({ activeViewerId: null }),
      selectMedia: (id) => set((state) => ({
        selectedMediaIds: state.selectedMediaIds.includes(id) 
          ? state.selectedMediaIds 
          : [...state.selectedMediaIds, id]
      })),
      deselectMedia: (id) => set((state) => ({
        selectedMediaIds: state.selectedMediaIds.filter(selectedId => selectedId !== id)
      })),
      clearSelection: () => set({ selectedMediaIds: [] }),
      selectAll: (ids) => set({ selectedMediaIds: ids }),
      toggleJobsPanel: () => set((state) => ({ isJobsPanelOpen: !state.isJobsPanelOpen })),
      toggleLogsPanel: () => set((state) => ({ isLogsPanelOpen: !state.isLogsPanelOpen })),
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    }),
    {
      name: 'curator-ui-storage',
      partialize: (state) => ({ 
        theme: state.theme, 
        viewMode: state.viewMode,
        isSidebarCollapsed: state.isSidebarCollapsed 
      }),
    }
  )
);
