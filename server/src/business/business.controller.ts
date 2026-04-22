import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BusinessService } from './business.service';

class CreateBusinessDto {
  companyName: string;
  legalName?: string;
  phoneNumberId?: number;
  category: string;
  subCategory?: string;
  description?: string;
  website?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  workingHours?: any;
  timezone?: string;
  callIntent?: string[];
}

class UpdateBusinessDto {
  companyName?: string;
  description?: string;
  website?: string;
  email?: string;
  workingHours?: any;
  callIntent?: string[];
}

class VerificationDocumentsDto {
  documents: Array<{ type: string; url: string }>;
}

@ApiTags('Business')
@Controller('business')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @ApiOperation({ summary: 'Create business account' })
  async createBusiness(@Request() req, @Body() data: CreateBusinessDto) {
    return this.businessService.createBusinessAccount(req.user.sub, data);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my business account' })
  async getMyBusiness(@Request() req) {
    return this.businessService.getBusinessAccountByUserId(req.user.sub);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update my business account' })
  async updateMyBusiness(@Request() req, @Body() data: UpdateBusinessDto) {
    return this.businessService.updateBusinessAccount(req.user.sub, data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business by ID' })
  @ApiParam({ name: 'id', type: Number })
  async getBusiness(@Param('id') id: number) {
    return this.businessService.getBusinessAccountById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get verified businesses' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getVerifiedBusinesses(
    @Query('category') category?: string,
    @Query('limit') limit?: string,
  ) {
    return this.businessService.getVerifiedBusinesses(
      category,
      limit ? parseInt(limit) : 20
    );
  }

  @Get('categories/all')
  @ApiOperation({ summary: 'Get business categories' })
  async getCategories() {
    return this.businessService.getBusinessCategories();
  }

  @Post('me/verify')
  @ApiOperation({ summary: 'Submit verification documents' })
  async submitVerification(@Request() req, @Body() data: VerificationDocumentsDto) {
    return this.businessService.submitVerification(req.user.sub, data.documents);
  }
}
