import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store/user';
import { colors, fonts } from '../../lib/theme';

const TIMEZONES = [
    'Asia/Taipei',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Asia/Seoul',
    'Asia/Hong_Kong',
    'Asia/Bangkok',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'UTC',
];

export default function TimezoneScreen() {
    const router = useRouter();
    const user = useUserStore((s) => s.user);
    const updateMe = useUserStore((s) => s.updateMe);

    const handleSelect = async (tz: string) => {
        if (tz === user?.timezone) {
            router.back();
            return;
        }
        // Optimistic close — store update is fire-and-forget
        router.back();
        await updateMe({ timezone: tz });
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.phoneBg }}>
            {/* Drag handle */}
            <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 8 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.darkBorder }} />
            </View>

            <Text style={{
                fontFamily: fonts.medium,
                fontSize: 18,
                letterSpacing: 4,
                color: colors.cream,
                textAlign: 'center',
                marginBottom: 24,
            }}>
                TIMEZONE
            </Text>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
            >
                {TIMEZONES.map((tz) => {
                    const active = user?.timezone === tz;
                    return (
                        <Pressable
                            key={tz}
                            onPress={() => handleSelect(tz)}
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 14,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.phoneBorder,
                                opacity: pressed ? 0.6 : 1,
                            })}
                        >
                            <Text style={{
                                fontFamily: fonts.regular,
                                fontSize: 13,
                                color: active ? colors.cream : colors.darkText,
                                letterSpacing: 0.65,
                            }}>
                                {tz}
                            </Text>
                            {active && (
                                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.cream }}>·</Text>
                            )}
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}
