import { Controller, Get, Post, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PhoneNumbersService } from './phone-numbers.service';

@ApiTags('Phone Numbers')
@Controller('phone-numbers')
export class PhoneNumbersController {
  constructor(private readonly phoneNumbersService: PhoneNumbersService) {}

  @Get('lookup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lookup phone number information' })
  @ApiQuery({ name: 'number', required: true, description: 'Phone number to lookup' })
  @ApiResponse({ status: 200, description: 'Caller information retrieved' })
  async lookup(
    @Query('number') number: string,
    @Request() req,
  ) {
    return this.phoneNumbersService.lookupNumber(number, req.user.sub);
  }

  @Get('identify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Identify caller for incoming call overlay' })
  @ApiQuery({ name: 'number', required: true })
  @ApiResponse({ status: 200, description: 'Caller identified with trust data' })
  async identify(
    @Query('number') number: string,
    @Request() req,
  ) {
    return this.phoneNumbersService.identifyCaller(number, req.user.phoneNumber);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending spam numbers' })
  @ApiResponse({ status: 200, description: 'List of trending spam numbers' })
  async getTrendingSpammers() {
    return this.phoneNumbersService.getTrendingSpammers();
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search phone numbers' })
  @ApiQuery({ name: 'q', required: true })
  async search(@Query('q') query: string) {
    return this.phoneNumbersService.searchNumbers(query);
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on number trustworthiness' })
  async vote(
    @Param('id') id: number,
    @Query('type') type: 'safe' | 'spam',
  ) {
    // Implementation would update vote counts
    return { message: `Voted ${type} for number ${id}` };
  }
}
