import { create } from 'zustand';

// Tracks which project ids have already been seen so registerProjectIds only
// auto-expands genuinely new projects (preserves user-collapsed state)
let knownProjectIds = new Set<number>();

interface NavigationState {
  activeView: 'sessions' | 'project';
  activeProjectId: number | null;

  // Sidebar collapse
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;

  // Immersive mode — all sidebars hide in sync
  immersiveMode: boolean;
  setImmersiveMode: (immersive: boolean) => void;

  // Sidebar project expansion, shared between ProjectSessionList and the
  // always-mounted session hotkeys so mod+1-9 numbering matches the visible list
  expandedProjects: Set<number>;
  toggleProjectExpanded: (projectId: number) => void;
  expandProject: (projectId: number) => void;
  registerProjectIds: (projectIds: number[]) => void;

  // Actions
  setActiveView: (view: 'sessions' | 'project') => void;
  setActiveProjectId: (projectId: number | null) => void;
  navigateToProject: (projectId: number) => void;
  navigateToSessions: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeView: 'sessions',
  activeProjectId: null,

  sidebarCollapsed: localStorage.getItem('pane-sidebar-collapsed') === 'true',
  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem('pane-sidebar-collapsed', String(collapsed));
    set({ sidebarCollapsed: collapsed });
  },
  toggleSidebarCollapsed: () => set((state) => {
    const next = !state.sidebarCollapsed;
    localStorage.setItem('pane-sidebar-collapsed', String(next));
    return { sidebarCollapsed: next };
  }),

  immersiveMode: false,
  setImmersiveMode: (immersive) => set({ immersiveMode: immersive }),

  expandedProjects: new Set<number>(),
  toggleProjectExpanded: (projectId) => set((state) => {
    const next = new Set(state.expandedProjects);
    if (next.has(projectId)) next.delete(projectId);
    else next.add(projectId);
    return { expandedProjects: next };
  }),
  expandProject: (projectId) => set((state) => {
    if (state.expandedProjects.has(projectId)) return state;
    const next = new Set(state.expandedProjects);
    next.add(projectId);
    return { expandedProjects: next };
  }),
  registerProjectIds: (projectIds) => set((state) => {
    const newIds = projectIds.filter(id => !knownProjectIds.has(id));
    knownProjectIds = new Set(projectIds);
    if (newIds.length === 0) return state;
    const next = new Set(state.expandedProjects);
    newIds.forEach(id => next.add(id));
    return { expandedProjects: next };
  }),

  setActiveView: (view) => set({ activeView: view }),

  setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),

  navigateToProject: (projectId) => set({
    activeView: 'project',
    activeProjectId: projectId
  }),

  navigateToSessions: () => set({
    activeView: 'sessions',
    activeProjectId: null
  }),
}));