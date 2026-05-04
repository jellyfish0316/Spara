import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:               uuid('id').primaryKey().defaultRandom(),
  appleId:          text('apple_id').unique(),
  email:            text('email'),
  timezone:         text('timezone').notNull().default('Asia/Taipei'),
  locale:           text('locale').notNull().default('en-TW'),
  paperAesthetic:   text('paper_aesthetic').notNull().default('classic_thermal'),
  subscriptionTier: text('subscription_tier', { enum: ['free', 'premium'] })
                      .notNull().default('free'),
  notificationPrefs: jsonb('notification_prefs').default({
    morning: true, evening: true, weekly: true, monthly: true,
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const dataSourceConnections = pgTable('data_source_connections', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  userId:             uuid('user_id').notNull().references(() => users.id),
  sourceType:         text('source_type', {
                        enum: ['health_kit', 'calendar', 'spotify', 'apple_music', 'plaid'],
                      }).notNull(),
  status:             text('status', {
                        enum: ['active', 'error', 'revoked', 'paused'],
                      }).notNull().default('active'),
  oauthAccessToken:   text('oauth_access_token'),
  oauthRefreshToken:  text('oauth_refresh_token'),
  oauthExpiresAt:     timestamp('oauth_expires_at'),
  scopes:             text('scopes').array(),
  lastSyncAt:         timestamp('last_sync_at'),
  lastSyncStatus:     text('last_sync_status'),
  createdAt:          timestamp('created_at').notNull().defaultNow(),
});

export const receipts = pgTable('receipts', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').notNull().references(() => users.id),
  localDate:        text('local_date').notNull(),
  receiptNumber:    integer('receipt_number').notNull(),
  state:            text('state', { enum: ['open', 'finalized'] })
                      .notNull().default('open'),
  verdictText:      text('verdict_text'),
  verdictMethod:    text('verdict_method', { enum: ['llm', 'fallback'] }),
  finalizeMode:     text('finalize_mode', { enum: ['manual', 'auto_4am'] }),
  finalizedAt:      timestamp('finalized_at'),
  rerollUsed:       boolean('reroll_used').notNull().default(false),
  weatherSnapshot:  jsonb('weather_snapshot'),
  locationSnapshot: jsonb('location_snapshot'),
  paperAesthetic:   text('paper_aesthetic').notNull().default('classic_thermal'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userDateUnique: unique().on(table.userId, table.localDate),
}));

export const lineItems = pgTable('line_items', {
  id:              uuid('id').primaryKey().defaultRandom(),
  receiptId:       uuid('receipt_id').notNull().references(() => receipts.id, {
                     onDelete: 'cascade',
                   }),
  position:        integer('position').notNull(),
  sourceType:      text('source_type', {
                     enum: ['voice_note', 'health_kit', 'calendar', 'spotify',
                            'apple_music', 'manual', 'plaid', 'weather', 'location'],
                   }).notNull(),
  sourceReference: text('source_reference'),
  quantity:        integer('quantity').notNull().default(1),
  itemText:        text('item_text').notNull(),
  priceText:       text('price_text').notNull(),
  priceType:       text('price_type', {
                     enum: ['dollars', 'priceless', 'free', 'zero', 'dash', 'stars'],
                   }).notNull(),
  priceValue:      numeric('price_value'),
  isPrivate:       boolean('is_private').notNull().default(false),
  rawInput:        text('raw_input'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
});

export const lineItemPhotos = pgTable('line_item_photos', {
  id:             uuid('id').primaryKey().defaultRandom(),
  lineItemId:     uuid('line_item_id').notNull().references(() => lineItems.id, {
                    onDelete: 'cascade',
                  }),
  photoReference: text('photo_reference').notNull(),
  thumbnailData:  text('thumbnail_data'),
  isShareable:    boolean('is_shareable').notNull().default(false),
  position:       integer('position').notNull().default(0),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
});

export const receiptRenders = pgTable('receipt_renders', {
  id:              uuid('id').primaryKey().defaultRandom(),
  receiptId:       uuid('receipt_id').notNull().references(() => receipts.id),
  paperAesthetic:  text('paper_aesthetic').notNull(),
  variant:         text('variant', {
                     enum: ['story_vertical', 'feed_square', 'library_thumb', 'share_fallback'],
                   }).notNull(),
  r2Url:           text('r2_url').notNull(),
  svgUrl:          text('svg_url'),
  contentHash:     text('content_hash').notNull(),
  rendererVersion: text('renderer_version').notNull(),
  generatedAt:     timestamp('generated_at').notNull().defaultNow(),
});

export const lineItemDrafts = pgTable('line_item_drafts', {
  id:              uuid('id').primaryKey().defaultRandom(),
  receiptId:       uuid('receipt_id').notNull().references(() => receipts.id),
  sourceType:      text('source_type').notNull(),
  sourceReference: text('source_reference'),
  rawData:         jsonb('raw_data').notNull(),
  status:          text('status', {
                     enum: ['pending', 'auto_accepted', 'rejected', 'formatting'],
                   }).notNull().default('pending'),
  formattedItem:   jsonb('formatted_item'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
});

export const shareEvents = pgTable('share_events', {
  id:         uuid('id').primaryKey().defaultRandom(),
  receiptId:  uuid('receipt_id').notNull().references(() => receipts.id),
  userId:     uuid('user_id').notNull().references(() => users.id),
  platform:   text('platform', {
                enum: ['instagram_story', 'instagram_feed', 'tiktok', 'imessage',
                       'copy_link', 'save_to_photos', 'other'],
              }).notNull(),
  format:     text('format', {
                enum: ['carousel', 'single_image', 'receipt_only'],
              }).notNull(),
  sharedAt:   timestamp('shared_at').notNull().defaultNow(),
});

export const receiptsRelations = relations(receipts, ({ many }) => ({
  lineItems: many(lineItems),
}));

export const lineItemsRelations = relations(lineItems, ({ one, many }) => ({
  receipt: one(receipts, { fields: [lineItems.receiptId], references: [receipts.id] }),
  photos: many(lineItemPhotos),
}));

export const lineItemPhotosRelations = relations(lineItemPhotos, ({ one }) => ({
  lineItem: one(lineItems, { fields: [lineItemPhotos.lineItemId], references: [lineItems.id] }),
}));
