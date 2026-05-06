import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTodayStore } from '../../store/today';
import { Receipt } from '../../components/receipt/Receipt';
import { colors, fonts } from '../../lib/theme';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const receipt = useTodayStore((s) => s.receipt);
  const loading = useTodayStore((s) => s.loading);
  const error = useTodayStore((s) => s.error);
  const loadToday = useTodayStore((s) => s.loadToday);
  const removeItem = useTodayStore((s) => s.removeItem);
  const router = useRouter();

  useEffect(() => { loadToday(); }, []);

  if (loading && !receipt) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.phoneBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.darkText} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.phoneBg, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: colors.darkText, fontFamily: fonts.regular }}>Error: {error}</Text>
      </View>
    );
  }
  if (!receipt) return null;

  const dayName = new Date(receipt.localDate + 'T00:00:00')
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  const showFinalize = receipt.lineItems.length >= 3 && receipt.state === 'open';

  return (
    <View style={{ flex: 1, backgroundColor: colors.phoneBg, paddingTop: insets.top }}>
      {/* Top nav */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
      }}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.darkTextDim, letterSpacing: 0.55 }}>
          {dayName}
        </Text>
        <Pressable onPress={() => router.push('/library')}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.darkTextDim, letterSpacing: 0.55 }}>
            library →
          </Text>
        </Pressable>
      </View>

      {/* Receipt scroll */}
      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <Receipt receipt={receipt} onDeleteItem={removeItem} />
      </ScrollView>

      {/* Bottom chrome */}
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10 + insets.bottom,
        borderTopWidth: 1,
        borderTopColor: colors.phoneBorder,
        flexDirection: 'row',
        gap: 10,
      }}>
        <Pressable
          onPress={() => router.push('/add')}
          style={({ pressed }) => ({
            flex: 1,
            height: 38,
            borderWidth: 1,
            borderColor: colors.darkBorder,
            borderRadius: 3,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.darkText, marginTop: -1 }}>+</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 10, letterSpacing: 0.8, color: colors.darkText }}>
            add a line
          </Text>
        </Pressable>

        {showFinalize && (
          <Pressable
            onPress={() => {/* finalize TODO */}}
            style={({ pressed }) => ({
              flex: 1,
              height: 38,
              backgroundColor: colors.cream,
              borderRadius: 3,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1, color: colors.ink }}>
              finalize
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
