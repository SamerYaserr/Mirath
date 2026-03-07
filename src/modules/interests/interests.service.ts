import { Injectable, NotFoundException } from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { InterestResDto } from './dto/responses/interest.res.dto';
import { InterestsRepository } from './repositories/interests.repository';

@Injectable()
export class InterestsService {
  constructor(private interestsRepository: InterestsRepository) {}

  async find(): Promise<HttpResponse> {
    const interests = await this.interestsRepository.findMany({
      where: { custom: false },
    });

    return {
      size: interests.length,
      data: interests.map((i) => InterestResDto.fromEntity(i)),
    };
  }

  async findById(interestId: string): Promise<HttpResponse> {
    const interest = await this.interestsRepository.findById(interestId);
    if (!interest)
      throw new NotFoundException('No interest found with this id');

    return { data: InterestResDto.fromEntity(interest) };
  }
}
