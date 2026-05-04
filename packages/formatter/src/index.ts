import type { FormattedLineItem, HealthEvent, PriceType } from '@spara/types';

const MAX_ITEM_TEXT_LENGTH = 28;

function truncate(text: string, max = MAX_ITEM_TEXT_LENGTH): string {
  return text.length > max ? text.slice(0, max - 1).trimEnd() : text;
}

export function hardcodedFormatter(transcript: string): FormattedLineItem {
  return {
    quantity: 1,
    itemText: truncate(transcript.toLowerCase()),
    priceText: 'priceless',
    priceType: 'priceless',
  };
}

export function formatHealthEvent(event: HealthEvent): FormattedLineItem | null {
  switch (event.type) {
    case 'steps': {
      const km = (event.value / 1000).toFixed(1);
      if (event.value < 1000) return null;
      return {
        quantity: 1,
        itemText: truncate(`walked ${km}km`),
        priceText: 'priceless',
        priceType: 'priceless',
      };
    }
    case 'workout': {
      const durationMs = new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
      const durationMin = durationMs / 60_000;
      if (durationMin < 5) return null;
      const workoutName = (event.metadata?.workoutType as string | undefined)?.toLowerCase() ?? 'workout';
      const label = workoutName === 'running' ? 'morning run' : `${workoutName}`;
      return {
        quantity: 1,
        itemText: truncate(label),
        priceText: 'priceless',
        priceType: 'priceless',
      };
    }
    case 'sleep': {
      const durationMs = new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
      const hours = (durationMs / 3_600_000).toFixed(1);
      return {
        quantity: 1,
        itemText: truncate(`slept ${hours}h`),
        priceText: 'free',
        priceType: 'free',
      };
    }
    case 'mindfulness': {
      const durationMs = new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
      const minutes = Math.round(durationMs / 60_000);
      if (minutes < 1) return null;
      return {
        quantity: 1,
        itemText: truncate(`${minutes}m meditation`),
        priceText: 'priceless',
        priceType: 'priceless',
      };
    }
    default:
      return null;
  }
}

export function formatPriceDisplay(priceType: PriceType, priceValue?: number | null): string {
  switch (priceType) {
    case 'dollars':
      return priceValue != null ? `$${priceValue.toFixed(2)}` : '$0.00';
    case 'priceless':
      return 'priceless';
    case 'free':
      return 'free';
    case 'zero':
      return '$0.00';
    case 'dash':
      return '–';
    case 'stars':
      return '★★★★★';
  }
}

export function formatReceiptNumber(n: number): string {
  return n.toString().padStart(5, '0');
}
