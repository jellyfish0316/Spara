import { View, Text, Pressable } from 'react-native';
import type { Receipt as ReceiptType, LineItem } from '@spara/types';
import { colors, fonts } from '../../lib/theme';

interface Props {
  receipt: ReceiptType;
  onDeleteItem?: (id: string) => void;
}

export function Receipt({ receipt, onDeleteItem }: Props) {
  return (
    <View>
      <View style={{ backgroundColor: colors.cream }}>
        <Perforation />
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Header receipt={receipt} />
          <SolidLine />
          <ColumnHeaders />
          <DashedLine />
          <View style={{ paddingTop: 4 }}>
            {receipt.lineItems.map((item) => (
              <LineItemRow key={item.id} item={item} onDelete={onDeleteItem} />
            ))}
          </View>
          <View style={{ paddingVertical: 6 }}>
            <DashedLine />
          </View>
          <SummaryRows verdictText={receipt.verdictText} />
          <ThankYou />
          <Barcode />
          <ReceiptCode localDate={receipt.localDate} />
        </View>
      </View>
      <Perforation />
    </View>
  );
}

function Perforation() {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: 14,
      backgroundColor: colors.cream,
    }}>
      {Array.from({ length: 16 }).map((_, i) => (
        <View key={i} style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.phoneBg,
        }} />
      ))}
    </View>
  );
}

function DashedLine() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {Array.from({ length: 32 }).map((_, i) => (
        <View key={i} style={{ width: 4, height: 1, backgroundColor: colors.inkFaint }} />
      ))}
    </View>
  );
}

function SolidLine() {
  return <View style={{ height: 1, backgroundColor: colors.inkFaint }} />;
}

function Header({ receipt }: { receipt: ReceiptType }) {
  const status = receipt.state === 'open' ? '—— IN PROGRESS ——' : '—— FINALIZED ——';
  return (
    <View style={{ alignItems: 'center', marginBottom: 14 }}>
      <Text style={{ fontFamily: fonts.regular, fontSize: 11, letterSpacing: 1.1, color: colors.inkLight, marginBottom: 2 }}>
        {formatDate(receipt.localDate)}
      </Text>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 17, letterSpacing: 2, color: colors.ink, marginBottom: 4 }}>
        DAILY RECEIPT
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 9, letterSpacing: 0.72, color: colors.inkLight }}>
        {status}
      </Text>
    </View>
  );
}

function ColumnHeaders() {
  const labelStyle = { fontFamily: fonts.regular, fontSize: 9, letterSpacing: 1.08, color: colors.inkLight };
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 6 }}>
      <Text style={[labelStyle, { width: 28 }]}>QTY</Text>
      <Text style={[labelStyle, { flex: 1, marginLeft: 6 }]}>DESCRIPTION</Text>
      <Text style={[labelStyle, { width: 56, textAlign: 'right' }]}>AMOUNT</Text>
    </View>
  );
}

function LineItemRow({ item, onDelete }: { item: LineItem; onDelete?: (id: string) => void }) {
  const isPriceless = item.priceType === 'priceless';
  return (
    <Pressable
      onLongPress={() => onDelete?.(item.id)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        paddingVertical: 5,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ width: 28, fontFamily: fonts.regular, fontSize: 11, color: colors.inkLight }}>
        {item.quantity}x
      </Text>
      <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 11, color: colors.ink, marginLeft: 6, lineHeight: 14 }}>
        {item.itemText}
      </Text>
      <Text style={{
        width: 56,
        fontFamily: isPriceless ? fonts.lightItalic : fonts.regular,
        fontSize: 10,
        color: colors.ink,
        textAlign: 'right',
      }}>
        {item.priceText.toLowerCase()}
      </Text>
    </Pressable>
  );
}

function SummaryRows({ verdictText }: { verdictText: string | null }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <SummaryRow label="SUBTOTAL" value="14h awake" />
      <SummaryRow label="TIPS" value="7h on screens" />
      <SummaryRow label="TAX" value="3h sleep debt" />
      <View style={{ marginTop: 6 }}>
        <DashedLine />
      </View>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: colors.inkFaint,
      }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.65, color: colors.ink }}>TOTAL</Text>
        {verdictText ? (
          <Text style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.65, color: colors.ink }} numberOfLines={1}>
            {verdictText}
          </Text>
        ) : (
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, letterSpacing: 3.3, color: colors.inkFaint }}>· · · · · · ·</Text>
        )}
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
      <Text style={{ fontFamily: fonts.regular, fontSize: 9, letterSpacing: 0.9, color: colors.inkLight }}>{label}</Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: colors.ink }}>{value}</Text>
    </View>
  );
}

function ThankYou() {
  const style = { fontFamily: fonts.regular, fontSize: 11, color: colors.inkLight, textAlign: 'center' as const, lineHeight: 16 };
  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <Text style={style}>thank you for living</Text>
      <Text style={style}>come again tomorrow</Text>
    </View>
  );
}

function Barcode() {
  const seq = [2,2,3,2,5,2,2,3,2,3,5,2,2,3,2,5,3,2,2,3,3,2,2,5,2,3,2,2,3,5,2,2,3,2,5,2,2,3,2,3,5,2,2,3,2,5,3,2,2,3,2,2,5,2,3,2,2,3,5,2,3,2,2,5,2,3,2,2,3,5,2,2,3,2,5,2,2,3,2,3];
  return (
    <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
      <View style={{ flexDirection: 'row', height: 40 }}>
        {seq.map((w, i) => (
          <View key={i} style={{ width: w, height: 40, backgroundColor: i % 2 === 0 ? colors.ink : 'transparent' }} />
        ))}
      </View>
    </View>
  );
}

function ReceiptCode({ localDate }: { localDate: string }) {
  const code = formatReceiptCode(localDate);
  return (
    <Text style={{
      textAlign: 'center',
      fontFamily: fonts.regular,
      fontSize: 10,
      letterSpacing: 2,
      color: colors.inkLight,
      paddingBottom: 18,
    }}>
      RCPT  ·  {code}  ·  TND
    </Text>
  );
}

function formatReceiptCode(localDate: string): string {
  const d = new Date(localDate + 'T00:00:00');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(2);
  return `${mm}${dd}${yy}`;
}

function formatDate(localDate: string): string {
  const d = new Date(localDate + 'T00:00:00');
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const dd = String(d.getDate()).padStart(2, '0');
  return `${days[d.getDay()]} ${dd} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
