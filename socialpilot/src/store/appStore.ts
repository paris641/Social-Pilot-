import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Client {
  id: string;
  name: string;
  brandName: string;
  industry?: string;
  healthScore: number;
  instagramUrl?: string;
  facebookUrl?: string;
  postsThisMonth?: number;
  engagement?: number;
  reach?: number;
  lastPostDate?: string;
  socialAccounts?: any[];
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  clientId?: string;
  client?: { name: string };
  createdAt: string;
}

interface AppStore {
  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  // Selected client
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;

  // Clients cache
  clients: Client[];
  setClients: (clients: Client[]) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;

  // Global search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Settings
  openAIKey: string;
  setOpenAIKey: (key: string) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      selectedClientId: null,
      setSelectedClientId: (id) => set({ selectedClientId: id }),

      clients: [],
      setClients: (clients) => set({ clients }),

      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      isSearchOpen: false,
      setIsSearchOpen: (open) => set({ isSearchOpen: open }),

      openAIKey: '',
      setOpenAIKey: (key) => set({ openAIKey: key }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'socialpilot-store',
      partialize: (state) => ({
        theme: state.theme,
        selectedClientId: state.selectedClientId,
        openAIKey: state.openAIKey,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
