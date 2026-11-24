import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { put, get } from '@vercel/blob';


//#region Setup

const app = express();
const httpServer = createServer(app);

//#endregion

//#region Middleware

app.use(express.json());

//#endregion

//#region Routes


async function readConfig() {
    const result = await get('config.txt', {
        access: 'private',
        useCache: false
    });

    if (!result) return null;

    return await new Response(result.stream).text();
}

app.get("/tasks/:id", async (req, res) => {
    try {
        const url = await readConfig();

        if (!url) return res.sendStatus(503);

        const baseUrl = url.startsWith('http')
            ? url
            : `http://${url}`;

        res.set('Cache-Control', 'no-store');
        return res.redirect(
            `${baseUrl}/task/${encodeURIComponent(req.params.id)}`
        );
    } catch (err) {
        console.error("Config read failed:", err);
        return res.sendStatus(500);
    }
});

app.patch("/api/url", async (req, res) => {
    try {
        const { API_TOKEN, url } = req.body;

        if (!process.env.API_TOKEN ||
            API_TOKEN !== process.env.API_TOKEN) {
            return res.sendStatus(401);
        }

        if (typeof url !== 'string' || !url.trim()) {
            return res.status(400).send("Invalid URL");
        }

        const blob = await put('config.txt', url.trim(), {
            access: 'private',
            allowOverwrite: true,
            contentType: 'text/plain'
        });

        console.log("Updated config:", blob.pathname);

        return res.sendStatus(204);
    } catch (err) {
        console.error("Config update failed:", err);
        return res.sendStatus(500);
    }
});

app.get("/api/url", async (req, res) => {
    try {
        const url = await readConfig();

        if (!url) return res.sendStatus(404);

        return res.type('text/plain').send(url);
    } catch (err) {
        console.error("Config read failed:", err);
        return res.sendStatus(500);
    }
});



//#endregion

//#region Server

process.on('SIGINT', () => httpServer.close());
process.on('SIGTERM', () => httpServer.close());



httpServer.listen(process.env.PORT, () => {
    console.log(`Server listening at ${process.env.PORT}`);
});
//#endregion