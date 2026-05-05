import { Hono } from 'hono';
import { db } from '../db';
import { receipts, lineItems } from '@spara/db';
import { eq } from 'drizzle-orm';

const app = new Hono();

const DEV_USER_ID = process.env.DEV_USER_ID!;

function getLocalDate(timezone: string): string {
    const adjusted = new Date(Date.now() - 4 * 60 * 60 * 1000);
    return adjusted.toLocaleDateString('en-CA', { timeZone: timezone });
}

app.get('/today', async (c) => {
    const user = await db.query.users.findFirst({
        where: (u, ops) => ops.eq(u.id, DEV_USER_ID),
    });

    if(!user) {
        return c.json({error: 'User not found'}, 404);
    }

    const today = getLocalDate(user.timezone);

    let receipt = await db.query.receipts.findFirst({
        where: (r, ops) => ops.and(ops.eq(r.userId, DEV_USER_ID), ops.eq(r.localDate, today)),
        with: {
            lineItems: {
                orderBy: (li, ops) => ops.asc(li.position),
            },
        },
    });

    if (!receipt) {
        const lastReceipt = await db.query.receipts.findFirst({
            where: (r, ops) => ops.eq(r.userId, DEV_USER_ID),
            orderBy: (r, ops) => ops.desc(r.receiptNumber),
        });

        const receiptNumber = (lastReceipt?.receiptNumber ?? 0) + 1;

        const inserted = await db.insert(receipts).values({
            userId: DEV_USER_ID,
            localDate: today,
            receiptNumber,
            paperAesthetic: user.paperAesthetic,
        }).returning();

        receipt = { ...inserted[0], lineItems: [] };

    }

    return c.json(receipt);
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const receipt = await db.query.receipts.findFirst({
    where: (r, ops) => ops.and(ops.eq(r.id, id), ops.eq(r.userId, DEV_USER_ID)),
    with: {
      lineItems: {
        orderBy: (li, ops) => ops.asc(li.position),
      },
    },
  });

  if (!receipt) return c.json({ error: 'Receipt not found' }, 404);

  return c.json(receipt);
});

app.post('/:id/finalize', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { verdictText } = body;

    const receipt = await db.query.receipts.findFirst({
        where: (r, ops) => ops.and(ops.eq(r.id, id), ops.eq(r.userId, DEV_USER_ID)),
        with: { lineItems: true },
    });

    if (!receipt) return c.json({ error: 'Receipt not found' }, 404);
    if (receipt.state !== 'open') return c.json({ error: 'Receipt already finalized' }, 403);
    if (!verdictText) return c.json({ error: 'verdictText is required' }, 400);

    const updated = await db.update(receipts)
    .set({
        state: 'finalized',
        verdictText: verdictText.toUpperCase().slice(0, 40),
        verdictMethod: 'llm',
        finalizeMode: 'manual',
        finalizedAt: new Date(),
    })
    .where(eq(receipts.id, id))
    .returning();

  return c.json(updated[0]);


});


export default app;

