import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MLService } from './ml.service';

class PredictBatchDto {
  phoneNumbers: string[];
}

@ApiTags('ML / AI')
@Controller('ml')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MLController {
  constructor(private readonly mlService: MLService) {}

  @Get('predict/:number')
  @ApiOperation({ summary: 'Predict if a phone number is spam' })
  @ApiParam({ name: 'number', description: 'Phone number to analyze' })
  async predictSpam(@Param('number') phoneNumber: string) {
    return this.mlService.predictSpam(phoneNumber);
  }

  @Post('predict/batch')
  @ApiOperation({ summary: 'Batch spam prediction for multiple numbers' })
  async predictBatch(@Body() data: PredictBatchDto) {
    const results = await this.mlService.batchPredict(data.phoneNumbers);
    return Object.fromEntries(results);
  }

  @Get('model/stats')
  @ApiOperation({ summary: 'Get ML model statistics' })
  async getModelStats() {
    return this.mlService.getModelStats();
  }

  @Post('model/train')
  @ApiOperation({ summary: 'Trigger model training (admin only)' })
  async trainModel() {
    return this.mlService.trainModel();
  }
}
