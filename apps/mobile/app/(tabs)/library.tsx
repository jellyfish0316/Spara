import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, Modal, ScrollView, ActivityIndicator } from 'react-native';
import type { Receipt } from '@spara/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fonts } from '../../lib/theme';
import { useLibraryStore } from '../../store/library';
import { Receipt as ReceiptView } from '../../components/receipt/Receipt';


const MONTH_ORDER = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH_NAMES: Record<string, string> = {
    JAN:'january',  FEB:'february', MAR:'march',     APR:'april',
    MAY:'may',      JUN:'june',     JUL:'july',      AUG:'august',
    SEP:'september',OCT:'october',  NOV:'november',  DEC:'december',
};
const DOW = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

interface DateParts {
    year: string;     // '2026'
    month: string;    // 'MAY'
    dayNum: string;   // '03'
    dow: string;      // 'SAT'
}

function parseDateParts(localDate: string): DateParts {
    const d = new Date(localDate + 'T00:00:00');
    return {
        year: String(d.getFullYear()),
        month: MONTH_ORDER[d.getMonth()],
        dayNum: String(d.getDate()).padStart(2, '0'),
        dow: DOW[d.getDay()],
    };
}

type GroupedReceipts = Record<string, Record<string, Receipt[]>>;

function groupByYearMonth(receipts: Receipt[]): GroupedReceipts {
    const grouped: GroupedReceipts = {};
    for (const r of receipts) {
        const { year, month } = parseDateParts(r.localDate);
        if (!grouped[year]) grouped[year] = {};
        if (!grouped[year][month]) grouped[year][month] = [];
        grouped[year][month].push(r);
    }
    return grouped;
}

function daysObservableInMonth(year: number, monthIndex: number): number {
    const now = new Date();
    if (year === now.getFullYear() && monthIndex === now.getMonth()) return now.getDate();
    return new Date(year, monthIndex + 1, 0).getDate();
}

function CompletionBar({ filled, total }: { filled: number; total: number }) {
    const ratio = total === 0 ? 0 : Math.min(1, filled / total);
    return (
        <View style={{ height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(34,28,20,0.25)' }}>
            <View style={{
                width: `${ratio * 100}%`,
                height: '100%',
                backgroundColor: colors.inkFaint,
                borderRadius: 1,
            }} />
        </View>
    );
}

function MonthBox({
    year, month, receipts, onPress,
}: {
    year: string;
    month: string;
    receipts: Receipt[];
    onPress: () => void;
}) {
    const monthIndex = MONTH_ORDER.indexOf(month);
    const total = daysObservableInMonth(Number(year), monthIndex);

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? '#221c14' : '#1e1810',
                borderWidth: 1,
                borderColor: pressed ? colors.darkBorder : colors.phoneBorder,
                borderRadius: 4,
                padding: 12,
                gap: 8,
                opacity: pressed ? 0.9 : 1,
            })}
        >
            <View>
                <Text style={{
                    fontFamily: fonts.medium,
                    fontSize: 13,
                    color: colors.cream,
                    letterSpacing: 0.78,
                    marginBottom: 3,
                }}>
                    {MONTH_NAMES[month]}
                </Text>
                <Text style={{
                    fontFamily: fonts.regular,
                    fontSize: 8,
                    color: '#4a3e30',
                    letterSpacing: 0.8,
                }}>
                    {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
                </Text>
            </View>

            <CompletionBar filled={receipts.length} total={total} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{
                    fontFamily: fonts.regular,
                    fontSize: 7,
                    color: colors.darkBorder,
                    letterSpacing: 0.56,
                }}>
                    {receipts.length} / {total} days
                </Text>
                <Text style={{
                    fontFamily: fonts.regular,
                    fontSize: 9,
                    color: colors.darkTextDim,
                }}>→</Text>
            </View>
        </Pressable>
    );
}

function YearSection({
    year, months, onSelectMonth,
}: {
    year: string;
    months: Record<string, Receipt[]>;
    onSelectMonth: (year: string, month: string, receipts: Receipt[]) => void;
}) {
    const sortedMonths = Object.keys(months).sort(
        (a, b) => MONTH_ORDER.indexOf(b) - MONTH_ORDER.indexOf(a),
    );
    const totalReceipts = Object.values(months).flat().length;

    const rows: string[][] = [];
    for (let i = 0; i < sortedMonths.length; i += 2) {
        rows.push(sortedMonths.slice(i, i + 2));
    }

    return (
        <View style={{ marginBottom: 24 }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: 10,
                marginBottom: 10,
                paddingBottom: 6,
                borderBottomWidth: 1,
                borderBottomColor: '#1e1810',
            }}>
                <Text style={{
                    fontFamily: fonts.semibold,
                    fontSize: 18,
                    color: colors.phoneBorder,
                    letterSpacing: 0.36,
                }}>
                    {year}
                </Text>
                <Text style={{
                    fontFamily: fonts.regular,
                    fontSize: 8,
                    color: colors.phoneBorder,
                    letterSpacing: 0.8,
                }}>
                    {totalReceipts} day{totalReceipts !== 1 ? 's' : ''} logged
                </Text>
            </View>

            <View style={{ gap: 8 }}>
                {rows.map((row, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                        {row.map((month) => (
                            <MonthBox
                                key={month}
                                year={year}
                                month={month}
                                receipts={months[month]}
                                onPress={() => onSelectMonth(year, month, months[month])}
                            />
                        ))}
                        {row.length === 1 && <View style={{ flex: 1 }} />}
                    </View>
                ))}
            </View>
        </View>
    );
}

function EditorialCard({
    receipt, onPress,
}: {
    receipt: Receipt;
    onPress: () => void;
}) {
    const { dayNum, month, dow } = parseDateParts(receipt.localDate);
    const visibleItems = receipt.lineItems.slice(0, 2);
    const extraCount = Math.max(0, receipt.lineItems.length - 2);
    const verdict = receipt.verdictText ?? '—';

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? '#f0e8d0' : colors.cream,
                borderRadius: 3,
                padding: 11,
                paddingTop: 14,
                paddingBottom: 14,
                gap: 7,
                overflow: 'hidden',
            })}
        >
            <MiniPerforation position="top" />

            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                <Text style={{
                    fontFamily: fonts.semibold,
                    fontSize: 28,
                    color: colors.ink,
                    letterSpacing: -0.56,
                    lineHeight: 28,
                }}>
                    {dayNum}
                </Text>
                <View>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 7, color: colors.inkLight, letterSpacing: 0.7, lineHeight: 9 }}>
                        {month}
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 7, color: colors.inkFaint, letterSpacing: 0.42, lineHeight: 9 }}>
                        {dow}
                    </Text>
                </View>
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(34,28,20,0.1)' }} />

            <View style={{ gap: 3 }}>
                {visibleItems.map((item, i) => (
                    <Text
                        key={item.id}
                        numberOfLines={1}
                        style={{
                            fontFamily: fonts.regular,
                            fontSize: 8,
                            color: i === 0 ? colors.ink : colors.inkLight,
                            letterSpacing: 0.08,
                            lineHeight: 11,
                        }}
                    >
                        {item.itemText}
                    </Text>
                ))}
                {extraCount > 0 && (
                    <Text style={{
                        fontFamily: fonts.regular,
                        fontSize: 7,
                        color: colors.inkFaint,
                        letterSpacing: 0.35,
                    }}>
                        +{extraCount} more
                    </Text>
                )}
            </View>

            <Text
                numberOfLines={1}
                style={{
                    fontFamily: fonts.regular,
                    fontSize: 7,
                    color: colors.inkLight,
                    letterSpacing: 0.7,
                }}
            >
                {verdict.toLowerCase()}
            </Text>

            <MiniPerforation position="bottom" />
        </Pressable>
    );
}

function MiniPerforation({ position }: { position: 'top' | 'bottom' }) {
    return (
        <View style={{
            position: 'absolute',
            left: 0, right: 0,
            [position]: 0,
            height: 6,
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
        }}>
            {Array.from({ length: 12 }).map((_, i) => (
                <View key={i} style={{
                    width: 4, height: 4, borderRadius: 2,
                    backgroundColor: colors.phoneBg,
                }} />
            ))}
        </View>
    );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 30,
            borderWidth: 1,
            borderColor: focused ? '#4a3e30' : colors.phoneBorder,
            borderRadius: 3,
            paddingHorizontal: 10,
            backgroundColor: focused ? '#1e1810' : 'transparent',
        }}>
            <Text style={{ fontSize: 11, color: colors.darkBorder }}>⌕</Text>
            <TextInput
                value={value}
                onChangeText={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="search..."
                placeholderTextColor={colors.darkBorder}
                style={{
                    flex: 1,
                    fontFamily: fonts.regular,
                    fontSize: 10,
                    color: colors.cream,
                    letterSpacing: 0.2,
                    padding: 0,
                }}
            />
            {value.length > 0 && (
                <Pressable onPress={() => onChange('')} hitSlop={8}>
                    <Text style={{ fontSize: 12, color: colors.darkBorder }}>×</Text>
                </Pressable>
            )}
        </View>
    );
}

function ReceiptDetailModal({
    receipt, onClose,
}: {
    receipt: Receipt | null;
    onClose: () => void;
}) {
    return (
        <Modal
            visible={receipt !== null}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                onPress={onClose}
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(14,12,9,0.88)',
                    justifyContent: 'center',
                    padding: 20,
                }}
            >
                <Pressable onPress={() => {}}>
                    <ScrollView
                        contentContainerStyle={{ paddingVertical: 8 }}
                        showsVerticalScrollIndicator={false}
                        style={{ maxHeight: '90%' }}
                    >
                        {receipt && <ReceiptView receipt={receipt} />}
                    </ScrollView>
                </Pressable>

                <Pressable onPress={onClose} style={{ alignItems: 'center', marginTop: 14 }}>
                    <Text style={{
                        fontFamily: fonts.regular,
                        fontSize: 9,
                        color: colors.darkTextDim,
                        letterSpacing: 0.72,
                    }}>
                        tap outside to close
                    </Text>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

export default function LibraryScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const receipts = useLibraryStore((s) => s.receipts);
    const loaded = useLibraryStore((s) => s.loaded);
    const loading = useLibraryStore((s) => s.loading);
    const error = useLibraryStore((s) => s.error);
    const loadReceipts = useLibraryStore((s) => s.loadReceipts);

    const [view, setView] = useState<'archive' | 'month'>('archive');
    const [selectedMonth, setSelectedMonth] = useState<{ year: string; month: string } | null>(null);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => { loadReceipts(); }, []);

    const grouped = useMemo(() => groupByYearMonth(receipts), [receipts]);
    const sortedYears = useMemo(
        () => Object.keys(grouped).sort((a, b) => Number(b) - Number(a)),
        [grouped],
    );

    const monthReceipts = selectedMonth
        ? grouped[selectedMonth.year]?.[selectedMonth.month] ?? []
        : [];
    const filteredMonthReceipts = useMemo(() => {
        if (!search.trim()) return monthReceipts;
        const q = search.toLowerCase();
        return monthReceipts.filter((r) => {
            const { dow, dayNum } = parseDateParts(r.localDate);
            if (dow.toLowerCase().includes(q)) return true;
            if (dayNum.includes(q)) return true;
            return r.lineItems.some((li) => li.itemText.toLowerCase().includes(q));
        });
    }, [monthReceipts, search]);

    const goodCount = monthReceipts.filter((r) => r.verdictText?.toLowerCase().includes('good')).length;

    const openMonth = (year: string, month: string) => {
        setSelectedMonth({ year, month });
        setSearch('');
        setView('month');
    };
    const goBack = () => {
        setView('archive');
        setSelectedMonth(null);
        setSearch('');
    };

    if (loading && !loaded) {
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

    return (
        <View style={{ flex: 1, backgroundColor: colors.phoneBg, paddingTop: insets.top }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 24,
                paddingVertical: 12,
            }}>
                {view === 'archive' ? (
                    <>
                        <Pressable onPress={() => router.push('/')}>
                            <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.darkTextDim, letterSpacing: 0.55 }}>
                                ← today
                            </Text>
                        </Pressable>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.darkBorder, letterSpacing: 0.55 }}>
                            library
                        </Text>
                        <View style={{ width: 40 }} />
                    </>
                ) : (
                    <>
                        <Pressable onPress={goBack}>
                            <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.darkTextDim, letterSpacing: 0.55 }}>
                                ← back
                            </Text>
                        </Pressable>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.darkBorder, letterSpacing: 0.55 }}>
                            {selectedMonth ? `${MONTH_NAMES[selectedMonth.month]} ${selectedMonth.year}` : ''}
                        </Text>
                        <View style={{ width: 40 }} />
                    </>
                )}
            </View>

            {view === 'month' && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
                    <SearchBar value={search} onChange={setSearch} />
                </View>
            )}

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 20 + insets.bottom }}
                showsVerticalScrollIndicator={false}
            >
                {view === 'archive' && (
                    receipts.length === 0 ? (
                        <View style={{ paddingTop: 80, alignItems: 'center' }}>
                            <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: colors.darkBorder, letterSpacing: 1, fontStyle: 'italic' }}>
                                no receipts yet
                            </Text>
                        </View>
                    ) : (
                        sortedYears.map((year) => (
                            <YearSection
                                key={year}
                                year={year}
                                months={grouped[year]}
                                onSelectMonth={(y, m) => openMonth(y, m)}
                            />
                        ))
                    )
                )}

                {view === 'month' && (
                    <>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: 10,
                        }}>
                            <Text style={{ fontFamily: fonts.regular, fontSize: 8, color: colors.darkBorder, letterSpacing: 0.8 }}>
                                {filteredMonthReceipts.length} receipt{filteredMonthReceipts.length !== 1 ? 's' : ''}
                            </Text>
                            <Text style={{ fontFamily: fonts.regular, fontSize: 8, color: colors.darkBorder, letterSpacing: 0.8 }}>
                                {goodCount} good
                            </Text>
                        </View>

                        {filteredMonthReceipts.length === 0 ? (
                            <View style={{ paddingTop: 60, alignItems: 'center' }}>
                                <Text style={{ fontFamily: fonts.regular, fontSize: 9, color: colors.phoneBorder, letterSpacing: 1, fontStyle: 'italic' }}>
                                    nothing found
                                </Text>
                            </View>
                        ) : (
                            <View style={{ gap: 10 }}>
                                {chunk(filteredMonthReceipts, 2).map((row, i) => (
                                    <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                                        {row.map((r) => (
                                            <EditorialCard key={r.id} receipt={r} onPress={() => setSelectedReceipt(r)} />
                                        ))}
                                        {row.length === 1 && <View style={{ flex: 1 }} />}
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <ReceiptDetailModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
        </View>
    );
}

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

