import { create } from 'zustand';
import type { Receipt, NewLineItemInput, HealthSnapshot } from '@spara/types';
import * as api from '../lib/api';

interface TodayState {
    receipt: Receipt | null;
    loading: boolean;
    error: string | null;
    loadToday: () => Promise<void>;
    addItem: (input: NewLineItemInput) => Promise<void>;
    removeItem: (id: string) => Promise<void>;
    finalize: (verdictText: string, healthSnapshot?: HealthSnapshot | null) => Promise<void>;
}

export const useTodayStore = create<TodayState>((set, get) => ({
    receipt: null,
    loading: false,
    error: null,

    loadToday: async () => {
        set({ loading: true, error: null });
        try {
            const receipt = await api.getToday();
            set({ receipt, loading: false });
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
        }
    },

    addItem: async (input) => {
        const receipt = get().receipt;
        if (!receipt) return;
        try {
            const updated = await api.addLineItem(receipt.id, input);
            set({ receipt: updated });
        } catch (err) {
            console.warn('Add failed:', err);
            await get().loadToday();
        }
    },

    removeItem: async (id) => {
        try {
            const updated = await api.deleteLineItem(id);
            set({ receipt: updated });
        } catch (err) {
            console.warn('Delete failed, refetching:', err);
            await get().loadToday();
        }
    },

    finalize: async (verdictText, healthSnapshot) => {
        const receipt = get().receipt;
        if (!receipt) return;
        const updated = await api.finalizeReceipt(receipt.id, verdictText, healthSnapshot);
        set({ receipt: updated });
    },
}));
