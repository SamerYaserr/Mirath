import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { IdDto } from 'src/common/dto/id.dto';
import { InterestsService } from './interests.service';
import { InterestResDto } from './dto/responses/interest.res.dto';

@ApiExtraModels(InterestResDto)
@Controller('interests')
export class InterestsController {
  constructor(private interestsService: InterestsService) {}

  @ApiOperation({
    summary: 'Get all predefined interests',
    description:
      'Retrieves a list of all predefined (non-custom) research interests available in the system',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved all interests',
    schema: {
      properties: {
        size: { type: 'number', example: 1 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(InterestResDto) },
        },
      },
    },
  })
  // ----------------------------------------------- //
  @Get()
  find() {
    return this.interestsService.find();
  }

  @ApiOperation({
    summary: 'Get interest by ID',
    description: 'Retrieves a specific interest by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique identifier of the interest',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the interest',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(InterestResDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Interest not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'No interest found with this id',
        error: 'Not Found',
      },
    },
  })
  // ----------------------------------------------- //
  @Get(':id')
  findById(@Param() { id }: IdDto) {
    return this.interestsService.findById(id);
  }
}
