import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import type { PriceType } from '@spara/types';
import { useTodayStore } from '../../store/today';
import { colors, fonts } from '../../lib/theme';

const PRICE_OPTIONS: { type: PriceType; label: string }[] = [
  { type: 'dollars', label: '$' },
  { type: 'priceless', label: 'priceless' },
  { type: 'free', label: 'free' },
  { type: 'zero', label: '$0' },
  { type: 'dash', label: '—' },
  { type: 'stars', label: '★★★★★' },
];

export default function AddScreen() {
    const router = useRouter();
    const addItem = useTodayStore((s) => s.addItem);

    const [itemText, setItemText] = useState('');
    const [priceType, setPriceType] = useState<PriceType>('priceless');
    const [priceValue, setPriceValue] = useState('');
    const [quantity, setQuantity] = useState(1);

    const canSubmit =
        itemText.trim().length > 0 &&
        (priceType !== 'dollars' || parseFloat(priceValue) > 0);

        const handleSubmit = () => {
            if (!canSubmit) return;

            let priceText: string;
            let parsedValue: number | undefined;

            switch (priceType) {
                case 'dollars':
                    parsedValue = parseFloat(priceValue);
                    priceText = `$${parsedValue.toFixed(2)}`;
                    break;
                case 'priceless': priceText = 'priceless'; break;
                case 'free': priceText = 'free'; break;
                case 'zero': priceText = '$0.00'; break;
                case 'dash': priceText = '—'; break;
                case 'stars': priceText = '★★★★★'; break;
            }

            // Fire and forget — modal closes instantly, store refetches when API returns
            addItem({
                sourceType: 'manual',
                itemText: itemText.trim(),
                priceText,
                priceType,
                priceValue: parsedValue,
                quantity,
            });

            router.back();
        };


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: colors.phoneBg }}
        >
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
                {/* Drag handle */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.darkBorder }} />
                </View>

                {/* Header */}
                <Text style={{
                    fontFamily: fonts.medium,
                    fontSize: 18,
                    letterSpacing: 4,
                    color: colors.cream,
                    textAlign: 'center',
                    marginBottom: 32,
                }}>
                    ADD A LINE
                </Text>

                {/* What */}
                <Text style={{
                    fontFamily: fonts.regular,
                    fontSize: 9,
                    letterSpacing: 1.5,
                    color: colors.darkTextDim,
                    marginBottom: 8,
                }}>
                    WHAT
                </Text>
                <TextInput
                    autoFocus
                    value={itemText}
                    onChangeText={setItemText}
                    placeholder="what did you do?"
                    placeholderTextColor={colors.darkTextDim}
                    style={{
                        fontFamily: fonts.regular,
                        fontSize: 16,
                        color: colors.cream,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.darkBorder,
                        paddingVertical: 8,
                    }}
                />
                {/* Quantity */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 12 }}>
                    <Text style={{
                        fontFamily: fonts.regular,
                        fontSize: 9,
                        letterSpacing: 1.5,
                        color: colors.darkTextDim,
                        marginRight: 8,
                    }}>
                        QTY
                    </Text>
                    <Pressable
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: colors.darkBorder,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ color: colors.cream, fontFamily: fonts.regular, fontSize: 18 }}>−</Text>
                    </Pressable>
                    <Text style={{
                        color: colors.cream,
                        fontFamily: fonts.regular,
                        fontSize: 16,
                        minWidth: 20,
                        textAlign: 'center',
                    }}>
                        {quantity}
                    </Text>
                    <Pressable
                        onPress={() => setQuantity(quantity + 1)}
                        style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: colors.darkBorder,
                        alignItems: 'center',
                        justifyContent: 'center',
                        }}
                    >
                        <Text style={{ color: colors.cream, fontFamily: fonts.regular, fontSize: 18 }}>+</Text>
                    </Pressable>
                </View>
                {/* Price type */}
                <Text style={{
                    fontFamily: fonts.regular,
                    fontSize: 9,
                    letterSpacing: 1.5,
                    color: colors.darkTextDim,
                    marginTop: 24,
                    marginBottom: 8,
                }}>
                    PRICE
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {PRICE_OPTIONS.map(({ type, label }) => {
                        const active = priceType === type;
                        return (
                            <Pressable
                                key={type}
                                onPress={() => setPriceType(type)}
                                style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderWidth: 1,
                                    borderColor: active ? colors.cream : colors.darkBorder,
                                    backgroundColor: active ? colors.cream : 'transparent',
                                    borderRadius: 3,
                                }}
                            >
                                <Text style={{
                                    fontFamily: fonts.regular,
                                    fontSize: 11,
                                    letterSpacing: 0.5,
                                    color: active ? colors.ink : colors.darkText,
                                }}>
                                    {label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Dollar input — only when 'dollars' selected */}
                {priceType === 'dollars' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                        <Text style={{
                            color: colors.cream,
                            fontFamily: fonts.regular,
                            fontSize: 18,
                            marginRight: 8,
                        }}>$</Text>
                        <TextInput
                            value={priceValue}
                            onChangeText={setPriceValue}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={colors.darkTextDim}
                            style={{
                                flex: 1,
                                fontFamily: fonts.regular,
                                fontSize: 16,
                                color: colors.cream,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.darkBorder,
                                paddingVertical: 8,
                            }}
                        />
                    </View>
                )}
                {/* Spacer pushes buttons to bottom */}
                <View style={{ flex: 1 }} />

                {/* Cancel / Add */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <Pressable
                        onPress={() => router.back()}
                        style={{
                            flex: 1,
                            height: 46,
                            borderWidth: 1,
                            borderColor: colors.darkBorder,
                            borderRadius: 23,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
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
                    <Pressable
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                        style={{
                            flex: 2,
                            height: 46,
                            backgroundColor: canSubmit ? colors.cream : colors.darkBorder,
                            borderRadius: 23,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{
                            fontFamily: fonts.medium,
                            fontSize: 11,
                            letterSpacing: 1.5,
                            color: canSubmit ? colors.ink : colors.darkTextDim,
                        }}>
                            add
                        </Text>
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );

}
