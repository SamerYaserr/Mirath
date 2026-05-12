import { Injectable, BadRequestException } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Readable } from 'stream';
import { winstonLogger as logger } from 'src/config/logger.config';
export type CloudinaryResourceType = 'image' | 'video' | 'auto';

@Injectable()
export class CloudinaryService {
  private uploadToFolder = 'mirath';

  async uploadFile(
    file: Express.Multer.File,
    folder: string = this.uploadToFolder,
    resourceType: CloudinaryResourceType = 'auto',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          quality: 'auto',
          fetch_format: 'auto',
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            logger.error('Cloudinary file upload failed', {
              error,
              filesize: file.size,
              filename: file.originalname,
              resourceType,
            });
            reject(new BadRequestException('Cloudinary file upload failed'));
          } else if (result) {
            resolve(result);
          }
        },
      );

      const bufferStream = Readable.from(file.buffer);
      bufferStream.pipe(uploadStream);
    });
  }

  async deleteFile(secureUrl: string): Promise<void> {
    const publicId = this.extractPublicIdFromUrl(secureUrl);

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      logger.error(
        `Failed to delete file with publicId: ${publicId} from Cloudinary`,
        { error },
      );
      throw new BadRequestException('Failed to delete file from Cloudinary');
    }
  }

  // Helper function to extract the public id from the secure url
  // This is needed for file removal
  private extractPublicIdFromUrl(url: string): string {
    const parts = url.split('/upload/');
    let pathAfterUpload = parts[1] ?? '';

    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');

    const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
    return publicId;
  }
}
