import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Cron } from 'croner';
import { runAutoFinalize } from './jobs/auto-finalize';

import receipts from './routes/receipts';
import lineItems from './routes/lineItems';
import suggestions from './routes/suggestions';
import weather from './routes/weather'
import healthSync from './routes/sync/health';
import users from './routes/users';



const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.route('/receipts', receipts);
app.route('/receipts', suggestions);
app.route('/line-items', lineItems);
app.route('/weather', weather);
app.route('/sync/health', healthSync);
app.route('/users', users);

app.get('/', (c) => c.json({ status: 'ok', service: 'spara-api' }));

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () => {
  console.log(`Spara API running on http://localhost:${port}`);
});

// Auto-finalize: every hour at :00, finalize any open receipts past their 4am cutoff.
new Cron('0 * * * *', async () => {
    try {
        const result = await runAutoFinalize();
        if (result.finalized > 0) {
            console.log(`[auto-finalize] finalized ${result.finalized} receipt(s)`);
        }
    } catch (err) {
        console.error('[auto-finalize] failed:', err);
    }
});


export default app;
