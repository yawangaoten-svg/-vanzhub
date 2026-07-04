import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './config';
import { Variables } from './auth-middleware';
import { errorHandler } from './error-handler';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import postRoutes from './routes/post';
import mediaRoutes from './routes/media';
import messageRoutes from './routes/message';
import notificationRoutes from './routes/notification';
import groupRoutes from './routes/group';
import searchRoutes from './routes/search';
import adminRoutes from './routes/admin';
import { WebSocketDO } from './do/websocket';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use('*', cors({
  origin: (origin, c) => {
    const origins = (c.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
    if (origins.includes(origin || '')) return origin;
    return origins[0] || 'http://localhost:3000';
  },
  credentials: true,
}));

app.onError(errorHandler);

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/posts', postRoutes);
app.route('/api/media', mediaRoutes);
app.route('/api/messages', messageRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/groups', groupRoutes);
app.route('/api/search', searchRoutes);
app.route('/api/admin', adminRoutes);

export { WebSocketDO };
export default app;
