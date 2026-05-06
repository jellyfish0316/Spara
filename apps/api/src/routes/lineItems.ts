import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { lineItems, receipts } from '@spara/db';

const app = new Hono();

const DEV_USER_ID = process.env.DEV_USER_ID!;

app.post('/', async(c) => {
    const body = await c.req.json();
    const { receiptId, sourceType, itemText, quantity, priceText, priceType, priceValue, rawInput, sourceReference } = body;

    const receipt = await db.query.receipts.findFirst({
        where: (r, ops) => ops.and(ops.eq(r.userId, DEV_USER_ID), ops.eq(r.id, receiptId)),
    });

    if (!receipt) return c.json({ error: 'Receipt not found'}, 404);
    if (receipt.state !== 'open') return c.json({ error: 'Receipt is finalized' }, 403);
    
    const lastItem = await db.query.lineItems.findFirst({
        where: (li, ops) => ops.eq(li.receiptId, receiptId),
        orderBy: (li, ops) => ops.desc(li.position),
    });

    const position = (lastItem?.position ?? -1) + 1;

    await db.insert(lineItems).values({
        receiptId,
        sourceType,
        itemText,
        quantity: quantity ?? 1,
        priceText,
        priceType,
        priceValue: priceValue?.toString(),
        rawInput,
        sourceReference,
        position,
    });

    const updated = await db.query.receipts.findFirst({
        where: (r, ops) => ops.eq(r.id, receiptId),
        with: {
            lineItems: {
                orderBy: (li, ops) => ops.asc(li.position),
            },
        },
    });

    return c.json(updated, 201);

});

app.delete('/:id', async(c) => {
    const id = c.req.param('id');

    const item = await db.query.lineItems.findFirst({
        where: (li, ops) => ops.eq(li.id, id),
        with: { receipt: true},
    });

    if (!item) return c.json({ error: 'Line item not found' }, 404);
    if (item.receipt.state !== 'open') return c.json({ error: 'Receipt is finalized' }, 403);

    await db.delete(lineItems).where(eq(lineItems.id, id));

    const updated = await db.query.receipts.findFirst({
        where: (r, ops) => ops.eq(r.id, item.receiptId),
        with: {
            lineItems: {
                orderBy: (li, ops) => ops.asc(li.position),
            },
        },
    });

    return c.json(updated);
});

export default app;