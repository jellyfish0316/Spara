import { Hono } from 'hono';
import OpenAI from 'openai';
import { db } from '../db';
import { pickVerdict } from '@spara/verdicts';

const app = new Hono();

const openai  = new OpenAI({apiKey: process.env.OPENAI_API_KEY, });

app.post('/:id/verdict-suggestions', async(c) => {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const metrics = body.metrics as { awakeHours: number; sleepHours: number; sleepDebtHours: number } | undefined;

    const receipt = await db.query.receipts.findFirst({
        where: (r, ops) => ops.eq(r.id, id),
        with: { lineItems: true },
    });

    if (!receipt) return c.json({ error: 'Receipt not found' }, 404);

    const itemList = receipt.lineItems
        .map(li => `${li.quantity}x ${li.itemText} · ${li.priceText}`)
        .join('\n');

    const healthLine = metrics
        ? `\n\nHealth: ${Math.round(metrics.awakeHours)}h awake, ${metrics.sleepHours.toFixed(1)}h slept, ${metrics.sleepDebtHours.toFixed(1)}h sleep debt.`
        : '';

    try {
        const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
            role: 'user',
            content: `Given this day's receipt, suggest 4 short verdicts (1-3 words, all caps) the user might want to write. Mix tones — one positive, one rueful, one neutral, one surprising. Make them feel earned by the actual content. Don't be generic. Don't be therapy-speak. Return only a JSON array of 4 strings, nothing else.\n\nLine items:\n${itemList}${healthLine}`,
            },
        ],
        max_tokens: 100,
        });

        const raw = response.choices[0].message.content ?? '[]';
        const suggestions = JSON.parse(raw);
        return c.json({ suggestions });

    } catch {
        const suggestions = [
        pickVerdict([]),
        pickVerdict([]),
        pickVerdict([]),
        pickVerdict([]),
        ];
        return c.json({ suggestions });
    }
});

export default app;
