import { Controller, Post, Get, Delete, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('media')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    
    // Cloudinary supports audio, video, and images (using resource_type: auto)
    if (!file.mimetype.startsWith('audio/') && !file.mimetype.startsWith('video/') && !file.mimetype.startsWith('image/')) {
        throw new BadRequestException('File must be an audio, video, or image file');
    }

    try {
      const result = await this.uploadService.uploadMedia(file);
      return {
        message: 'Upload successful',
        url: result.secure_url,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new BadRequestException('Failed to upload file to Cloudinary');
    }
  }

  @Get('media')
  async listMedia() {
    try {
      const resources = await this.uploadService.listMedia();
      return {
        message: 'Success',
        resources,
      };
    } catch (error) {
      console.error('Cloudinary list error:', error);
      throw new BadRequestException('Failed to list media from Cloudinary');
    }
  }

  @Delete('media')
  async deleteMedia(@Query('public_id') publicId: string, @Query('resource_type') resourceType: string = 'image') {
    if (!publicId) {
      throw new BadRequestException('public_id is required');
    }
    
    try {
      const result = await this.uploadService.deleteMedia(publicId, resourceType);
      return {
        message: 'Deleted successfully',
        result,
      };
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new BadRequestException('Failed to delete media from Cloudinary');
    }
  }
}
