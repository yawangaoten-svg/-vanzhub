import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class MediaService {
  async uploadMedia(userId: string, file: Express.Multer.File, postId?: string) {
    const media = await prisma.media.create({
      data: {
        url: `/uploads/${file.filename}`,
        type: file.mimetype,
        size: file.size,
        userId,
        postId: postId || null,
      },
    });
    return media;
  }

  async uploadMultipleMedia(userId: string, files: Express.Multer.File[], postId?: string) {
    const mediaItems = await Promise.all(
      files.map(file =>
        prisma.media.create({
          data: {
            url: `/uploads/${file.filename}`,
            type: file.mimetype,
            size: file.size,
            userId,
            postId: postId || null,
          },
        })
      )
    );
    return mediaItems;
  }

  async getUserMedia(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.media.count({ where: { userId } }),
    ]);

    return {
      data: media,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async deleteMedia(mediaId: string, userId: string) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new AppError('Media not found', 404);
    if (media.userId !== userId) throw new AppError('Not authorized', 403);

    await prisma.media.delete({ where: { id: mediaId } });
  }

  async createAlbum(userId: string, data: { title: string; description?: string; coverUrl?: string }) {
    const album = await prisma.album.create({
      data: {
        title: data.title,
        description: data.description || null,
        coverUrl: data.coverUrl || null,
        userId,
      },
    });
    return album;
  }

  async getUserAlbums(userId: string) {
    return prisma.album.findMany({
      where: { userId },
      include: {
        _count: { select: { media: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addMediaToAlbum(albumId: string, mediaIds: string[], userId: string) {
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) throw new AppError('Album not found', 404);
    if (album.userId !== userId) throw new AppError('Not authorized', 403);

    await prisma.media.updateMany({
      where: { id: { in: mediaIds }, userId },
      data: { albumId },
    });
  }
}
