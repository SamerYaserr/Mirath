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
export class ChatAudioPipe implements PipeTransform {
  async transform(value: unknown, _metadata: ArgumentMetadata) {
    const parseFilePipe = new ParseFilePipe({
      fileIsRequired: true,
      validators: [
        new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }), // 25 MB
        new FileTypeValidator({ fileType: /(mp3|mp4|wav|webm|m4a|ogg)$/i }),
      ],
    });

    try {
      return await parseFilePipe.transform(value);
    } catch (error: unknown) {
      const msg =
        error instanceof Error && error.message.includes('File too large')
          ? 'Audio file size must not exceed 25 MB'
          : error instanceof Error && error.message.includes('file type')
            ? 'Audio must be in MP3, MP4, WAV, WebM, M4A, or OGG format'
            : 'Invalid audio file';

      throw new BadRequestException(msg);
    }
  }
}
