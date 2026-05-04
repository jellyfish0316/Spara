import { Hono } from 'hono';
import { db } from '../db';
import { receipts, lineItems } from '@spara/db';

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

export default app;

