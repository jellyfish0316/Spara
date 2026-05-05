import { Tabs } from 'expo-router';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'today' }} />
        <Tabs.Screen name="library" options={{ title: 'library' }} />
        <Tabs.Screen name="profile" options={{ title: 'profile' }} />
        </Tabs>
    );
}
