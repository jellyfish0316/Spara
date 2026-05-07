import { create } from 'zustand';
import type { User, UserUpdateInput } from '@spara/types';
import * as api from '../lib/api';

interface UserState {
    user: User | null;
    loaded: boolean;
    loading: boolean;
    error: string | null;
    loadMe: () => Promise<void>;
    updateMe: (input: UserUpdateInput) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
    user: null,
    loaded: false,
    loading: false,
    error: null,

    loadMe: async () => {
        if (get().loading) return;
        set({ loading: true, error: null });
        try {
            const user = await api.getMe();
            set({ user, loaded: true, loading: false });
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
        }
    },

    updateMe: async (input) => {
        try {
            const user = await api.updateMe(input);
            set({ user });
        } catch (err) {
            console.warn('Update failed:', err);
            await get().loadMe();
        }
    },
}));
