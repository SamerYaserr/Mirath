import { OmitType, PartialType } from '@nestjs/swagger';
import { FormattedProfileWithMeta, ProfileResDto } from './profile.res.dto';

export class MyProfileResDto extends PartialType(
  OmitType(ProfileResDto, ['isMe', 'isFollowing'] as const),
) {
  static fromDomain(
    data: Partial<Omit<FormattedProfileWithMeta, 'isMe' | 'isFollowing'>>,
  ): MyProfileResDto {
    const dto = new MyProfileResDto();

    dto.id = data.id!;
    dto.username = data.username!;
    dto.fullName = data.fullName!;
    dto.email = data.email ?? null;
    dto.photoUrl = data.photoUrl ?? null;
    dto.bio = data.bio ?? null;
    dto.birthDate = data.birthDate ?? null;
    dto.country = data.country!;
    dto.levelOfEducation = data.levelOfEducation!;
    dto.university = data.university!;
    dto.role = data.role!;
    dto.status = data.status!;
    dto.isEmailVisible = data.isEmailVisible!;
    dto.isPremium = data.isPremium!;
    dto.createdAt = data.createdAt!;
    dto.updatedAt = data.updatedAt!;

    dto.followersCount = data.followersCount ?? 0;
    dto.followingCount = data.followingCount ?? 0;

    dto.interests =
      data.interests?.map((i) => ({
        id: i.id!,
        name: i.name!,
      })) ?? [];

    dto.fieldsOfStudy =
      data.fieldsOfStudy?.map((f) => ({
        id: f.id!,
        name: f.name!,
      })) ?? [];

    return dto;
  }
}
