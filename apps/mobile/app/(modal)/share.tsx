import { useRef } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import { useTodayStore } from '../../store/today';
import { Receipt } from '../../components/receipt/Receipt';
import { colors, fonts } from '../../lib/theme';
import Share, { Social } from 'react-native-share';
import { captureRef } from 'react-native-view-shot';


export default function ShareScreen() {
    const router = useRouter();
    const receipt = useTodayStore((s) => s.receipt);
    const viewShotRef = useRef<ViewShot>(null);

    if (!receipt || receipt.state !== 'finalized') {
        return (
            <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.darkTextDim }}>
                    finalize today's receipt first
                </Text>
            </View>
        );
    }

    const handleShare = async () => {
        if (!viewShotRef.current) return;
        try {
            const base64 = await captureRef(viewShotRef, {
                format: 'png',
                quality: 1,
                result: 'base64',
            });
            await Share.shareSingle({
                social: Social.InstagramStories,
                stickerImage: `data:image/png;base64,${base64}`,
                backgroundTopColor: colors.cream,
                backgroundBottomColor: colors.bg,
                appId: 'com.spara.app',
            });
            router.back();
        } catch (err) {
            console.warn('Share to stories failed:', err);
        }
    };


    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
                marginBottom: 4,
            }}>
                SHARE
            </Text>
            <Text style={{
                fontFamily: fonts.regular,
                fontSize: 9,
                letterSpacing: 1.35,
                color: colors.darkTextDim,
                textAlign: 'center',
                marginBottom: 24,
            }}>
                INSTAGRAM STORIES
            </Text>

            {/* Receipt preview — this is what we capture */}
            <ScrollView
                contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 32, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
            >
                <ViewShot
                    ref={viewShotRef}
                    options={{ format: 'png', quality: 1, result: 'base64' }}
                    style={{ alignSelf: 'stretch' }}
                >
                    <Receipt receipt={receipt} />
                </ViewShot>
            </ScrollView>

            {/* Bottom actions */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 10 }}>
                <Pressable
                    onPress={handleShare}
                    style={({ pressed }) => ({
                        height: 46,
                        backgroundColor: colors.cream,
                        borderRadius: 23,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                    })}
                >
                    <Text style={{
                        fontFamily: fonts.medium,
                        fontSize: 11,
                        letterSpacing: 1.5,
                        color: colors.ink,
                    }}>
                        share to stories
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => router.back()}
                    style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}
                >
                    <Text style={{
                        fontFamily: fonts.regular,
                        fontSize: 11,
                        letterSpacing: 1,
                        color: colors.darkTextDim,
                    }}>
                        cancel
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}
