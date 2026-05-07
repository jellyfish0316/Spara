import type { Receipt, NewLineItemInput, HealthEvent, HealthSnapshot, WeatherSnapshot, LocationSnapshot } from '@spara/types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;
const USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID!;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json();
}

export function getReceipts(): Promise<Receipt[]> {
    return request(`/receipts?userId=${USER_ID}`)
}

export function getToday(): Promise<Receipt> {
    return request(`/receipts/today?userId=${USER_ID}`);
}

export function getReceipt(id: string): Promise<Receipt> {
    return request(`/receipts/${id}`);
}

export function addLineItem(receiptId: string, data: NewLineItemInput): Promise<Receipt> {
    return request('/line-items', {
        method: 'POST',
        body: JSON.stringify({ ...data, receiptId, userId: USER_ID }),
    });
}

export function deleteLineItem(id: string): Promise<Receipt> {
    return request(`/line-items/${id}`, { method: 'DELETE' });
}

export function finalizeReceipt(id: string, verdictText: string, healthSnapshot?: HealthSnapshot | null): Promise<Receipt> {
    return request(`/receipts/${id}/finalize`, {
        method: 'POST',
        body: JSON.stringify({ verdictText, healthSnapshot }),
    });
}

export function getVerdictSuggestions(id: string, metrics?: HealthSnapshot | null): Promise<{ suggestions: string[] }> {
    return request(`/receipts/${id}/verdict-suggestions`, {
        method: 'POST',
        body: JSON.stringify({ metrics }),
    });
}

export function syncHealth(events: HealthEvent[], localDate: string): Promise<void> {
    return request('/sync/health', {
        method: 'POST',
        body: JSON.stringify({ userId: USER_ID, events, localDate }),
    });
}

export function getWeather(lat: number, lng: number): Promise<{
    temp: number;
    condition: string;
    unit: string;
    area: string;
    country: string;
}> {
    return request(`/weather?lat=${lat}&lng=${lng}`);
}

export function setReceiptSnapshot(
    id: string,
    snapshot: { weatherSnapshot?: WeatherSnapshot | null; locationSnapshot?: LocationSnapshot | null },
): Promise<Receipt> {
    return request(`/receipts/${id}/snapshot`, {
        method: 'POST',
        body: JSON.stringify(snapshot),
    });
}
