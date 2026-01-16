import {
  Controller,
  Post,
  Param,
  Delete,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PapersService } from './papers.service';
import { IdDto } from 'src/common/dto/id.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';

@Controller('papers')
export class PapersController {
  constructor(private readonly papersService: PapersService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Save a paper',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Save a paper to library',
    example: {
      message: 'Paper saved successfully',
      data: {
        id: 'paper-id-123',
        userId: 'user-id-456',
        paperId: 'paper-id-123',
        createdAt: '2025-12-10T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Paper not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Paper is already saved',
  })
  @HttpCode(HttpStatus.OK)
  @Post(':id/save')
  savePaper(@Param() { id }: IdDto, @Req() req: Request) {
    const userId = req.user!.id;
    return this.papersService.savePaper(id, userId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a saved paper',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Saved paper deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Paper not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Paper is not saved',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/save')
  deleteSavedPaper(@Param() { id }: IdDto, @Req() req: Request) {
    const userId = req.user!.id;
    return this.papersService.deleteSavedPaper(id, userId);
  }
}
