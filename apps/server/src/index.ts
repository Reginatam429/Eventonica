import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [process.env.CLIENT_ORIGIN || 'http://localhost:5173'],
    credentials: true
}));

app.use('/api/auth', authRouter);

app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
