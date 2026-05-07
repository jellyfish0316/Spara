import * as Location from 'expo-location';

export interface Coords {
    lat: number;
    lng: number;
}

export async function ensureLocationAuth(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
}

export async function getCoords(): Promise<Coords | null> {
    const ok = await ensureLocationAuth();
    if (!ok) return null;
    try {
        const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });
        return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (err) {
        console.warn('Location read failed:', err);
        return null;
    }
}
