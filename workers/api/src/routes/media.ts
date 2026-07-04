import { Hono } from 'hono';
import { Env } from '../config';
import { getPrisma } from '../database';
import { AppError } from '../error-handler';
import { authenticate } from '../auth-middleware';

const router = new Hono<{ Bindings: Env; Variables: { user: any } }>();

const MAX_FILE_SIZE = 10485760;

router.post('/upload', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const body = await c.req.parseBody();
  const file = body['image'] as File | undefined;

  if (!file) throw new AppError('No file uploaded', 400);
  if (file.size > MAX_FILE_SIZE) throw new AppError('File too large', 400);

  const key = `uploads/${user.userId}/${Date.now()}-${file.name}`;
  await c.env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const url = `https://api.vanzhub.com/uploads/${key}`;
  const media = await prisma.media.create({
    data: { url, type: file.type, size: file.size, userId: user.userId },
  });

  return c.json({ status: 'success', data: media }, 201);
});

router.post('/upload-multiple', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const body = await c.req.parseBody();

  const files: File[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (value instanceof File) files.push(value);
  }

  if (files.length === 0) throw new AppError('No files uploaded', 400);

  const mediaItems = await Promise.all(
    files.map(async (file) => {
      const key = `uploads/${user.userId}/${Date.now()}-${file.name}`;
      await c.env.R2_BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type },
      });
      const url = `https://api.vanzhub.com/uploads/${key}`;
      return prisma.media.create({
        data: { url, type: file.type, size: file.size, userId: user.userId },
      });
    })
  );

  return c.json({ status: 'success', data: mediaItems }, 201);
});

router.post('/upload-video', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const body = await c.req.parseBody();
  const file = body['video'] as File | undefined;

  if (!file) throw new AppError('No file uploaded', 400);
  if (file.size > MAX_FILE_SIZE * 10) throw new AppError('File too large', 400);

  const key = `uploads/${user.userId}/${Date.now()}-${file.name}`;
  await c.env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const url = `https://api.vanzhub.com/uploads/${key}`;
  const media = await prisma.media.create({
    data: { url, type: file.type, size: file.size, userId: user.userId },
  });

  return c.json({ status: 'success', data: media }, 201);
});

router.get('/', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const skip = (page - 1) * limit;

  const [media, total] = await Promise.all([
    prisma.media.findMany({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.media.count({ where: { userId: user.userId } }),
  ]);

  return c.json({
    status: 'success', data: media,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

router.delete('/:id', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const media = await prisma.media.findUnique({ where: { id: c.req.param('id') } });
  if (!media) throw new AppError('Media not found', 404);
  if (media.userId !== user.userId) throw new AppError('Not authorized', 403);

  await prisma.media.delete({ where: { id: c.req.param('id') } });
  return c.json({ status: 'success', message: 'Media deleted' });
});

export default router;
