import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Server as SocketServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

import path from 'path';
import config from './config';
import { errorHandler } from './middleware/errorHandler';
import { setupSocketHandlers } from './config/socket';
import routes from './routes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

const io = new SocketServer(server, {
  cors: {
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  },
  pingInterval: 25000,
  pingTimeout: 20000,
});

setupSocketHandlers(io);

app.set('io', io);
app.set('prisma', prisma);

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: { error: 'Too many requests, please try again later.' },
}));

app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));

app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`VANZHUB API running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

export { app, server, io, prisma };
