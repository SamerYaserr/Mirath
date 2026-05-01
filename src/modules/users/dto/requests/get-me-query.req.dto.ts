import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export const USER_FIELD_WHITELIST = new Set([
  'id',
  'username',
  'fullName',
  'email',
  'photoUrl',
  'bio',
  'country',
  'birthDate',
  'levelOfEducation',
  'university',
  'isEmailVisible',
  'isPremium',
  'createdAt',
  'updatedAt',
  'interests',
  'fieldsOfStudy',
  'role',
]);

export const RELATION_FIELDS = new Set(['interests', 'fieldsOfStudy']);

export const BLACKLISTED_FIELDS = new Set(['password', 'providerId', 'status']);

export class GetMeQueryDto {
  @ApiPropertyOptional({
    description:
      'Comma-separated list of fields to return. ' +
      'Allowed: ' +
      [...USER_FIELD_WHITELIST].join(', ') +
      '. ' +
      'Sensitive fields (' +
      [...BLACKLISTED_FIELDS].join(', ') +
      ') are always excluded.',
    example: 'interests,fullName,photoUrl',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  fields?: string;
}
