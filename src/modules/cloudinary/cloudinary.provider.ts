import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config/configuration';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (configService: ConfigService<AppConfig, true>) => {
    return cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  },
  inject: [ConfigService],
};
