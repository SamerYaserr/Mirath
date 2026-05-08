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
export class ChatImagePipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const parseFilePipe = new ParseFilePipe({
      fileIsRequired: true,
      validators: [
        new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10 MB
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|gif)$/ }),
      ],
    });

    try {
      return await parseFilePipe.transform(value);
    } catch (error: any) {
      const msg = error.message.includes('File too large')
        ? 'Image file size must not exceed 10MB'
        : error.message.includes('file type')
          ? 'Image must be in JPG, JPEG, PNG, WebP, or GIF format'
          : 'Invalid image file';

      throw new BadRequestException(msg);
    }
  }
}
