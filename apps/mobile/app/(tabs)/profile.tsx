import type { Receipt } from '@spara/types';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store/user';
import { useLibraryStore } from '../../store/library';
import { useTodayStore } from '../../store/today';
import * as api from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const user = useUserStore((s) => s.user);
    const userLoaded = useUserStore((s) => s.loaded);
    const loadMe = useUserStore((s) => s.loadMe);

    const receipts = useLibraryStore((s) => s.receipts);
    const libraryLoaded = useLibraryStore((s) => s.loaded);
    const loadReceipts = useLibraryStore((s) => s.loadReceipts);

    const todayReceipt = useTodayStore((s) => s.receipt);
    const reloadToday = useTodayStore((s) => s.loadToday);

    useEffect(() => {
        loadMe();
        if (!libraryLoaded) loadReceipts();
    }, []);

    const stats = useMemo(() => {
        const localDates = receipts.map((r) => r.localDate);
        // Include today's localDate if today is finalized — library already includes it via addReceipt, but be defensive
        if (todayReceipt?.state === 'finalized' && !localDates.includes(todayReceipt.localDate)) {
            localDates.push(todayReceipt.localDate);
        }
        return {
            total: receipts.length,
            streak: computeStreak(localDates),
            good: countGood(receipts),
        };
    }, [receipts, todayReceipt]);

    const handleReopen = async () => {
        if (!todayReceipt) return;
        if (todayReceipt.state === 'open') return;
        try {
            await api.reopenReceipt(todayReceipt.id);
            await reloadToday();
        } catch (err) {
            console.warn('Reopen failed:', err);
        }
    };

    if (!userLoaded) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.phoneBg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.darkText} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.phoneBg, paddingTop: insets.top }}>
            {/* Top nav */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 24,
                paddingVertical: 12,
            }}>
                <View style={{ width: 40 }} />
                <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.darkBorder, letterSpacing: 0.55 }}>
                    profile
                </Text>
                <Pressable onPress={() => router.push('/')}>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.darkTextDim, letterSpacing: 0.55 }}>
                        today →
                    </Text>
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 + insets.bottom }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={{ marginBottom: 32 }}>
                    <Text style={{
                        fontFamily: fonts.semibold,
                        fontSize: 28,
                        letterSpacing: 4,
                        color: colors.cream,
                        marginBottom: 4,
                    }}>
                        you
                    </Text>
                    <Text style={{
                        fontFamily: fonts.regular,
                        fontSize: 11,
                        color: colors.darkTextDim,
                        letterSpacing: 0.55,
                    }}>
                        {user?.email ?? '—'}
                    </Text>
                </View>

                {/* Stats */}
                <Section label="STATS">
                    <StatRow value={stats.total} label="receipts" />
                    <StatRow value={stats.streak} label={stats.streak === 1 ? 'day streak' : 'day streak'} />
                    <StatRow value={stats.good} label={stats.good === 1 ? 'good one' : 'good ones'} />
                </Section>

                {/* Settings */}
                <Section label="SETTINGS">
                    <SettingRow
                        label="timezone"
                        value={user?.timezone}
                        onPress={() => router.push('/timezone')}
                    />
                </Section>

                {/* Dev */}
                <Section label="DEV">
                    <SettingRow
                        label="reopen today's receipt"
                        onPress={handleReopen}
                        disabled={!todayReceipt || todayReceipt.state === 'open'}
                    />
                    <SettingRow label="version" value="1.0.0" />
                </Section>
            </ScrollView>
        </View>
    );
}

function toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

function computeStreak(localDates: string[]): number {
    const set = new Set(localDates);
    const cursor = new Date();
    // If today isn't in the set, start counting from yesterday — open receipts don't break the streak
    if (!set.has(toIsoDate(cursor))) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (set.has(toIsoDate(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

function countGood(receipts: Receipt[]): number {
    return receipts.filter((r) => r.verdictText?.toLowerCase().includes('good')).length;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <View style={{ marginBottom: 28 }}>
            <Text style={{
                fontFamily: fonts.regular,
                fontSize: 9,
                letterSpacing: 1.35,
                color: colors.darkTextDim,
                marginBottom: 10,
            }}>
                {label}
            </Text>
            <View style={{
                borderTopWidth: 1,
                borderTopColor: colors.phoneBorder,
            }}>
                {children}
            </View>
        </View>
    );
}

function StatRow({ value, label }: { value: string | number; label: string }) {
    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.phoneBorder,
            gap: 16,
        }}>
            <Text style={{
                fontFamily: fonts.semibold,
                fontSize: 22,
                color: colors.cream,
                minWidth: 56,
                textAlign: 'right',
            }}>
                {value}
            </Text>
            <Text style={{
                fontFamily: fonts.regular,
                fontSize: 11,
                color: colors.darkText,
                letterSpacing: 0.55,
            }}>
                {label}
            </Text>
        </View>
    );
}

function SettingRow({ label, value, onPress, disabled }: {
    label: string;
    value?: string;
    onPress?: () => void;
    disabled?: boolean;
}) {
    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.phoneBorder,
                opacity: pressed && !disabled ? 0.6 : 1,
            })}
        >
            <Text style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: disabled ? colors.darkTextDim : colors.cream,
                letterSpacing: 0.6,
            }}>
                {label}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {value && (
                    <Text style={{
                        fontFamily: fonts.regular,
                        fontSize: 11,
                        color: colors.darkTextDim,
                        letterSpacing: 0.55,
                    }}>
                        {value}
                    </Text>
                )}
                {onPress && !disabled && (
                    <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.darkTextDim }}>→</Text>
                )}
            </View>
        </Pressable>
    );
}