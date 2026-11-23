import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

//#region Setup

const app = express();
const httpServer = createServer(app);

//#endregion

//#region Middleware

app.use(express.json());

//#endregion

//#region Routes

app.get("/tasks/:id", (req, res) => {
    const base = process.env.REDIRECT_URL;
    if (!base) return res.sendStatus(500);
    return res.redirect(`http://${base}/task/${encodeURIComponent(req.params.id)}`);
})

//#endregion

//#region Server

process.on('SIGINT', () => httpServer.close());
process.on('SIGTERM', () => httpServer.close());



httpServer.listen(process.env.PORT, () => {
    console.log(`Server listening at ${process.env.PORT}`);
});
//#endregion