import { Controller, Get, Param } from '@nestjs/common';
import { InterestsService } from './interests.service';
import { IdDto } from 'src/common/dto/id.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('interests')
export class InterestsController {
  constructor(private interestsService: InterestsService) {}

  @ApiOperation({
    summary: 'Get all predefined interests',
    description:
      'Retrieves a list of all predefined (non-custom) research interests available in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all interests',
    schema: {
      example: {
        size: 2,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Physics',
            custom: false,
            createdAt: '2025-12-10T10:30:00.000Z',
            updatedAt: '2025-12-10T10:30:00.000Z',
          },
          {
            id: '223e4567-e89b-12d3-a456-426614174001',
            name: 'Computer Science',
            custom: false,
            createdAt: '2025-12-10T10:30:00.000Z',
            updatedAt: '2025-12-10T10:30:00.000Z',
          },
        ],
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
    status: 200,
    description: 'Successfully retrieved the interest',
    schema: {
      example: {
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Physics',
          custom: false,
          createdAt: '2025-12-10T10:30:00.000Z',
          updatedAt: '2025-12-10T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
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
