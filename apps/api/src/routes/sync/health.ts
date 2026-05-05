import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { receipts, lineItems } from '@spara/db';
import { formatHealthEvent } from '@spara/formatter';

const app = new Hono();

const DEV_USER_ID = process.env.DEV_USER_ID!;

app.post('/', async (c) => {
    const body = await c.req.json();
    const { events, localDate } = body;

    const receipt = await db.query.receipts.findFirst({
        where: (r, ops) => ops.and(ops.eq(r.userId, DEV_USER_ID), ops.eq(r.localDate, localDate)),
    });

    if (!receipt) return c.json({ error: 'No receipt for this date' }, 404);
    if (receipt.state !== 'open') return c.json({ synced: 0 }); 

    let synced = 0;

    for (const event of events) {
        const existing = db.query.lineItems.findFirst({
            where: (li, ops) => ops.and(
                ops.eq(li.receiptId. receipt.id),
                ops.eq(li.sourceReference, event.sourceReference)
            ),
        });

        if (existing) continue;

        const formatted = formatHealthEvent(event);
        if (!formatted) continue;

        const lastItem = await db.query.lineItems.findFirst({
            where: (li, ops) => ops.eq(li.receiptId, receipt.id),
            orderBy: (li, ops) => ops.desc(li.position),
        });

        const position = (lastItem?.position ?? -1) + 1;

        await db.insert(lineItems).values({
            receiptId: receipt.id,
            sourceType: 'health_kit',
            sourceReference: event.sourceReference,
            itemText: formatted.itemText,
            quantity: formatted.quantity,
            priceText: formatted.priceText,
            priceType: formatted.priceType,
            position,
        });

        synced++;
    };

    return c.json({ synced });

});

export default app;