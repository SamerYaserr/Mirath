import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

const AUDIO_MIME_REGEX =
  /(audio)\/(mpeg|mp3|mp4|wav|wave|x-wav|webm|m4a|ogg|x-m4a)/i;
const IMAGE_MIME_REGEX = /(image)\/(jpeg|png|webp|gif)/i;

const AUDIO_MAX_BYTES = 25 * 1024 * 1024;
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

@Injectable()
export class ChatFilePipe implements PipeTransform {
  async transform(value: unknown, _metadata: ArgumentMetadata) {
    const file = value as Express.Multer.File | undefined;

    if (!file) {
      throw new BadRequestException('A file is required.');
    }

    const isAudio = AUDIO_MIME_REGEX.test(file.mimetype);
    const isImage = IMAGE_MIME_REGEX.test(file.mimetype);

    if (!isAudio && !isImage) {
      throw new BadRequestException(
        'Unsupported file type. ' +
          'Upload an image (jpg, jpeg, png, webp, gif) ' +
          'or audio (mp3, mp4, wav, webm, m4a, ogg).',
      );
    }

    if (isAudio && file.size > AUDIO_MAX_BYTES) {
      throw new BadRequestException('Audio file size must not exceed 25 MB.');
    }

    if (isImage && file.size > IMAGE_MAX_BYTES) {
      throw new BadRequestException('Image file size must not exceed 10 MB.');
    }

    return file;
  }
}
