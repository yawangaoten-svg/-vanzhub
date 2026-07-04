import { v2 as cloudinary } from 'cloudinary';
import config from '../config';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export class UploadService {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (config.cloudinary.enabled) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'vanzhub',
        resource_type: 'auto',
      });
      return result.secure_url;
    }
    return `/uploads/${file.filename}`;
  }

  async uploadMultiple(files: Express.Multer.File[]): Promise<string[]> {
    return Promise.all(files.map(f => this.uploadFile(f)));
  }

  async deleteFile(url: string): Promise<void> {
    if (!config.cloudinary.enabled || !url.includes('cloudinary')) return;
    const publicId = url.split('/').pop()?.split('.')[0];
    if (publicId) {
      await cloudinary.uploader.destroy(`vanzhub/${publicId}`);
    }
  }
}

export const uploadService = new UploadService();
