import { Hono } from 'hono';
import { db } from '../db';
import { receipts, lineItems } from '@spara/db';
import { eq } from 'drizzle-orm';
import { runAutoFinalize } from '../jobs/auto-finalize'; // Dev-only

const app = new Hono();

const DEV_USER_ID = process.env.DEV_USER_ID!;

function getLocalDate(timezone: string): string {
    const adjusted = new Date(Date.now() - 4 * 60 * 60 * 1000);
    return adjusted.toLocaleDateString('en-CA', { timeZone: timezone });
}

app.get('/', async (c) => {
    const allFinalized = await db.query.receipts.findMany({
        where: (r, ops) => ops.and(
            ops.eq(r.userId, DEV_USER_ID),
            ops.eq(r.state, 'finalized'),
        ),
        orderBy: (r, ops) => ops.desc(r.localDate),
        with: {
            lineItems: {
                orderBy: (li, ops) => ops.asc(li.position),
            },
        },
    });
    return c.json(allFinalized);
});

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

// Dev-only: trigger the auto-finalize scan immediately
app.post('/jobs/auto-finalize', async (c) => {
    const result = await runAutoFinalize();
    return c.json(result);
});

// Dev-only: backdate a receipt to test auto-finalize
app.post('/:id/backdate', async (c) => {
    const id = c.req.param('id');
    const { localDate } = await c.req.json();
    await db.update(receipts)
        .set({
            state: 'open',
            localDate,
            verdictText: null,
            verdictMethod: null,
            finalizeMode: null,
            finalizedAt: null,
        })
        .where(eq(receipts.id, id));
    return c.json({ ok: true });
});
// Dev-only: end

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
    const { verdictText, healthSnapshot } = body;

    const receipt = await db.query.receipts.findFirst({
        where: (r, ops) => ops.and(ops.eq(r.id, id), ops.eq(r.userId, DEV_USER_ID)),
        with: { lineItems: true },
    });

    if (!receipt) return c.json({ error: 'Receipt not found' }, 404);
    if (receipt.state !== 'open') return c.json({ error: 'Receipt already finalized' }, 403);
    if (!verdictText) return c.json({ error: 'verdictText is required' }, 400);

    await db.update(receipts)
    .set({
        state: 'finalized',
        verdictText: verdictText.toUpperCase().slice(0, 40),
        verdictMethod: 'llm',
        finalizeMode: 'manual',
        finalizedAt: new Date(),
        healthSnapshot: healthSnapshot ?? null,
    })
    .where(eq(receipts.id, id));

    const updated = await db.query.receipts.findFirst({
        where: (r, ops) => ops.eq(r.id, id),
        with: {
            lineItems: {
                orderBy: (li, ops) => ops.asc(li.position),
            },
        },
    });

  return c.json(updated);


});

app.post('/:id/snapshot', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { weatherSnapshot, locationSnapshot } = body;

    const receipt = await db.query.receipts.findFirst({
        where: (r, ops) => ops.and(ops.eq(r.id, id), ops.eq(r.userId, DEV_USER_ID)),
    });
    if (!receipt) return c.json({ error: 'Receipt not found' }, 404);

    await db.update(receipts)
        .set({
            weatherSnapshot: weatherSnapshot ?? receipt.weatherSnapshot,
            locationSnapshot: locationSnapshot ?? receipt.locationSnapshot,
        })
        .where(eq(receipts.id, id));

    const updated = await db.query.receipts.findFirst({
        where: (r, ops) => ops.eq(r.id, id),
        with: {
            lineItems: {
                orderBy: (li, ops) => ops.asc(li.position),
            },
        },
    });
    return c.json(updated);
});


// Dev-only: reset a finalized receipt back to open
app.post('/:id/reopen', async (c) => {
    const id = c.req.param('id');
    await db.update(receipts)
    .set({
        state: 'open',
        verdictText: null,
        verdictMethod: null,
        finalizeMode: null,
        finalizedAt: null,
        rerollUsed: false,
    })
    .where(eq(receipts.id, id));

    const updated = await db.query.receipts.findFirst({
        where: (r, ops) => ops.eq(r.id, id),
        with: {
            lineItems: {
                orderBy: (li, ops) => ops.asc(li.position),
            },
        },
    });
    return c.json(updated);
});


export default app;

