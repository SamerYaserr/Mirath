import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';

export interface AiServicePayload {
  service: 'explain' | 'summarize_snippet' | 'translate';
  input_text: string;
  target_language?: string;
}

interface ExternalAiResponse {
  answer: string;
}

@Injectable()
export class AiServicesProxy {
  private readonly logger = new Logger(AiServicesProxy.name);

  constructor(private readonly httpService: HttpService) {}

  async call(payload: AiServicePayload): Promise<string> {
    const url = `${process.env.EXTERNAL_API_BASE_URL}/AI/Services`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<ExternalAiResponse>(url, payload),
      );

      return response.data.answer;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          this.logger.error({
            message: 'AI service returned a non-2xx response',
            service: payload.service,
            externalStatus: error.response.status,
            externalBody: error.response.data,
          });

          throw new BadGatewayException(
            'AI service failed to generate a response',
          );
        }

        this.logger.error({
          message: 'AI service is unreachable (no response received)',
          service: payload.service,
          axiosCode: error.code,
          axiosMessage: error.message,
        });

        throw new ServiceUnavailableException(
          'AI service is currently unavailable',
        );
      }

      this.logger.error({
        message: 'Unexpected error while calling AI service',
        service: payload.service,
        error,
      });

      throw new ServiceUnavailableException(
        'AI service is currently unavailable',
      );
    }
  }
}
