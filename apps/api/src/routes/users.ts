import { Hono } from 'hono';
import { db } from '../db';
import { users } from '@spara/db';
import { eq } from 'drizzle-orm';

const app = new Hono();

const DEV_USER_ID = process.env.DEV_USER_ID!;

app.get('/me', async (c) => {
    const user = await db.query.users.findFirst({
        where: (u, ops) => ops.eq(u.id, DEV_USER_ID),
    });
    if (!user) return c.json({ error: 'User not found' }, 404);
    return c.json(user);
});

app.patch('/me', async (c) => {
    const body = await c.req.json();
    const { timezone } = body;

    const updates: { timezone?: string } = {};
    if (typeof timezone === 'string' && timezone.length > 0) updates.timezone = timezone;

    if (Object.keys(updates).length === 0) {
        return c.json({ error: 'No valid fields to update' }, 400);
    }

    await db.update(users).set(updates).where(eq(users.id, DEV_USER_ID));

    const updated = await db.query.users.findFirst({
        where: (u, ops) => ops.eq(u.id, DEV_USER_ID),
    });
    return c.json(updated);
});

export default app;
