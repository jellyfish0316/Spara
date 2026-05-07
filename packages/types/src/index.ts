export type PriceType = 'dollars' | 'priceless' | 'free' | 'zero' | 'dash' | 'stars';

export type LineItemSourceType =
  | 'voice_note'
  | 'health_kit'
  | 'calendar'
  | 'spotify'
  | 'apple_music'
  | 'manual'
  | 'plaid'
  | 'weather'
  | 'location';

export type ReceiptState = 'open' | 'finalized';

export type PaperAesthetic =
  | 'classic_thermal'
  | 'diner_check'
  | 'conbini'
  | 'vintage_cash_register'
  | 'square_pos';

export type SubscriptionTier = 'free' | 'premium';

export interface User {
    id: string;
    email: string | null;
    timezone: string;
    locale: string;
    paperAesthetic: string;
    subscriptionTier: SubscriptionTier;
    createdAt: string;
}

export interface UserUpdateInput {
    timezone?: string;
}

export interface WeatherSnapshot {
  temp: number;
  condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow';
  unit: 'C' | 'F';
}

export interface LocationSnapshot {
  area: string;
  country: string;
}

export interface HealthSnapshot {
  awakeHours: number;
  sleepHours: number;
  sleepDebtHours: number;
}

export interface LineItemPhoto {
  id: string;
  lineItemId: string;
  photoReference: string;
  thumbnailData: string | null;
  isShareable: boolean;
  position: number;
  createdAt: string;
}

export interface LineItem {
  id: string;
  receiptId: string;
  position: number;
  sourceType: LineItemSourceType;
  sourceReference: string | null;
  quantity: number;
  itemText: string;
  priceText: string;
  priceType: PriceType;
  priceValue: string | null;
  isPrivate: boolean;
  rawInput: string | null;
  createdAt: string;
  photos?: LineItemPhoto[];
}

export interface Receipt {
  id: string;
  userId: string;
  localDate: string;
  receiptNumber: number;
  state: ReceiptState;
  verdictText: string | null;
  verdictMethod: 'llm' | 'fallback' | null;
  finalizeMode: 'manual' | 'auto_4am' | null;
  finalizedAt: string | null;
  rerollUsed: boolean;
  weatherSnapshot: WeatherSnapshot | null;
  locationSnapshot: LocationSnapshot | null;
  healthSnapshot: HealthSnapshot | null;
  paperAesthetic: PaperAesthetic;
  lineItems: LineItem[];
  renderUrl: string | null;
  thumbUrl: string | null;
  createdAt: string;
}

export interface NewLineItemInput {
  sourceType: LineItemSourceType;
  itemText: string;
  quantity?: number;
  priceText: string;
  priceType: PriceType;
  priceValue?: number;
  rawInput?: string;
  sourceReference?: string;
}

export interface FormattedLineItem {
  quantity: number;
  itemText: string;
  priceText: string;
  priceType: PriceType;
  priceValue?: number;
}

export interface HealthEvent {
  type: 'steps' | 'workout' | 'sleep' | 'mindfulness';
  value: number;
  unit: string;
  startDate: string;
  endDate: string;
  sourceReference: string;
  metadata?: Record<string, unknown>;
}

export interface PaperAestheticConfig {
  id: string;
  name: string;
  paperColor: string;
  inkColor: string;
  fontFamily: string;
  fontSize: { header: number; body: number; small: number };
  letterSpacing: { header: number; body: number };
  dividerStyle: 'dashed' | 'dotted' | 'solid';
  headerFormat: 'centered' | 'left';
  barcodeStyle: 'standard' | 'none' | 'qr';
  tearEdge: boolean;
  currencyLocale: string;
}


