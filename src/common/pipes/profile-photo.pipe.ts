import {
  ArgumentMetadata,
  BadRequestException,
  FileTypeValidator,
  Injectable,
  MaxFileSizeValidator,
  ParseFilePipe,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ProfilePhotoPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const parseFilePipe = new ParseFilePipe({
      fileIsRequired: false,
      validators: [
        new MaxFileSizeValidator({ maxSize: 30 * 1024 * 1024 }), // 30 MB
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }), // The file must be an image
      ],
    });

    try {
      return await parseFilePipe.transform(value);
    } catch (error: any) {
      const msg = error.message.includes('File too large')
        ? 'Profile photo file size must not exceed 3MB'
        : error.message.includes('file type')
          ? 'Profile photo must be in JPG, JPEG, PNG, or WebP format'
          : 'Invalid profile photo file';

      throw new BadRequestException(msg);
    }
  }
}
