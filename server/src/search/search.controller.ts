import {
  Controller,
  Get,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search phone numbers or names' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Request() req,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.search(
      query,
      req.user.sub,
      limit ? parseInt(limit) : 20
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Get search history' })
  async getHistory(@Request() req, @Query('limit') limit?: string) {
    return this.searchService.getSearchHistory(
      req.user.sub,
      limit ? parseInt(limit) : 20
    );
  }

  @Delete('history')
  @ApiOperation({ summary: 'Clear search history' })
  async clearHistory(@Request() req) {
    return this.searchService.clearSearchHistory(req.user.sub);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending searches' })
  async getTrending(@Query('limit') limit?: string) {
    return this.searchService.getTrendingSearches(
      limit ? parseInt(limit) : 10
    );
  }
}
