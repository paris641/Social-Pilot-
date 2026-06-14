import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Client {
    id: string;
    name: string;
    igHandle: string;
    fbPage: string;
    fee: number;
    logs: Record<string, Record<string, any>>;
    ads: any[];
    billing: Record<string, string>;
}

interface StoreState {
    clients: Client[];
    activeClientId: string | null;
    addClient: (c: Client) => void;
    deleteClient: (id: string) => void;
    setActiveClient: (id: string) => void;
    updateClient: (id: string, updates: Partial<Client>) => void;
}

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            clients: [],
            activeClientId: null,
            addClient: (c) => set({ clients: [...get().clients, c], activeClientId: c.id }),
            deleteClient: (id) => {
               const clients = get().clients.filter(x => x.id !== id);
               set({ clients, activeClientId: clients.length > 0 ? clients[0].id : null });
            },
            setActiveClient: (id) => set({ activeClientId: id }),
            updateClient: (id, updates) => set({
               clients: get().clients.map(c => c.id === id ? { ...c, ...updates } : c)
            })
        }),
        { name: 'socioplot-storage', storage: createJSONStorage(() => AsyncStorage) }
    )
);
