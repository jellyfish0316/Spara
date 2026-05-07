import { create } from 'zustand';
import type { Receipt } from '@spara/types';
import * as api from '../lib/api';

interface LibraryState {
    receipts: Receipt[];
    loaded: boolean;
    loading: boolean;
    error: string | null;
    loadReceipts: () => Promise<void>;
    addReceipt: (receipt: Receipt) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
    receipts: [],
    loaded: false,
    loading: false,
    error: null,

    loadReceipts: async () => {
        if (get().loading) return;
        set({ loading: true, error: null });
        try {
            const receipts = await api.getReceipts();
            set({ receipts, loaded: true, loading: false });
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
        }
    },

    addReceipt: (receipt) => {
        set((s) => ({
            receipts: [receipt, ...s.receipts.filter((r) => r.id !== receipt.id)],
        }));
    },
}));