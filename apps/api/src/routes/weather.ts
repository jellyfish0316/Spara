import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) => {
    const lat = c.req.query('lat');
    const lng = c.req.query('lng');

    if (!lat || !lng) return c.json({ error: 'lat and lng required' }, 400);

    const apiKey = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

    const res = await fetch(url);
    if (!res.ok) return c.json({ error: 'Weather fetch failed' }, 502);

    const data = await res.json() as any;

    const conditionMap: Record<string, string> = {
        Clear: 'clear',
        Clouds: 'cloudy',
        Rain: 'rain',
        Drizzle: 'drizzle',
        Thunderstorm: 'storm',
        Snow: 'snow',
    };

    return c.json({
        temp: Math.round(data.main.temp),
        condition: conditionMap[data.weather[0].main] ?? 'clear',
        unit: 'C',
        area: data.name,
        country: data.sys.country,
    });
});

export default app;
