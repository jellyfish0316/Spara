import { Stack } from 'expo-router';
import {
    useFonts,
    IBMPlexMono_300Light,
    IBMPlexMono_300Light_Italic,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
} from '@expo-google-fonts/ibm-plex-mono';

export default function RootLayout() {
    const [loaded] = useFonts({
        IBMPlexMono_300Light,
        IBMPlexMono_300Light_Italic,
        IBMPlexMono_400Regular,
        IBMPlexMono_500Medium,
        IBMPlexMono_600SemiBold,
    });

    if (!loaded) return null;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(modal)" options={{ presentation: 'modal' }} />
        </Stack>
    );
}
