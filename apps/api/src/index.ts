import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import receipts from './routes/receipts';
import lineItems from './routes/lineItems';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.route('/receipts', receipts);
app.route('/line-items', lineItems);

app.get('/', (c) => c.json({ status: 'ok', service: 'spara-api' }));

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () => {
  console.log(`Spara API running on http://localhost:${port}`);
});

export default app;
