import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  uploadMedia(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'toeic_media',
          resource_type: 'auto', // 'auto' allows Cloudinary to detect if it's image, video, or raw
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload result is undefined'));
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async listMedia(): Promise<any[]> {
    try {
      // Use search API to fetch all resource types in the folder
      const result = await cloudinary.search
        .expression('folder:toeic_media')
        .sort_by('created_at', 'desc')
        .max_results(500)
        .execute();
      return result.resources || [];
    } catch (error) {
      // Fallback if search API is not enabled (e.g. Basic plan)
      console.warn('Search API failed, falling back to resources API:', error);
      
      const images = await cloudinary.api.resources({ type: 'upload', prefix: 'toeic_media/', max_results: 500, resource_type: 'image' });
      const videos = await cloudinary.api.resources({ type: 'upload', prefix: 'toeic_media/', max_results: 500, resource_type: 'video' });
      const raw = await cloudinary.api.resources({ type: 'upload', prefix: 'toeic_media/', max_results: 500, resource_type: 'raw' });
      
      const allResources = [
        ...(images.resources || []),
        ...(videos.resources || []),
        ...(raw.resources || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return allResources;
    }
  }

  async deleteMedia(publicId: string, resourceType: string = 'image'): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
