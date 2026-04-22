import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContactsService } from './contacts.service';

class CreateContactDto {
  name: string;
  phoneNumber: string;
  isFavorite?: boolean;
  tags?: string[];
}

class UpdateContactDto {
  name?: string;
  isFavorite?: boolean;
  isBlocked?: boolean;
  tags?: string[];
}

class SyncContactsDto {
  contacts: Array<{
    name: string;
    phoneNumber: string;
    isFavorite?: boolean;
  }>;
}

@ApiTags('Contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all contacts' })
  @ApiQuery({ name: 'favorite', required: false, type: Boolean })
  @ApiQuery({ name: 'blocked', required: false, type: Boolean })
  async getContacts(
    @Request() req,
    @Query('favorite') favorite?: string,
    @Query('blocked') blocked?: string,
  ) {
    const filters = {
      isFavorite: favorite === 'true',
      isBlocked: blocked === 'true',
    };
    return this.contactsService.getContacts(req.user.sub, filters);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get favorite contacts' })
  async getFavorites(@Request() req) {
    return this.contactsService.getFavorites(req.user.sub);
  }

  @Get('blocked')
  @ApiOperation({ summary: 'Get blocked contacts' })
  async getBlocked(@Request() req) {
    return this.contactsService.getBlocked(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  @ApiParam({ name: 'id', type: Number })
  async getContact(@Request() req, @Param('id') id: number) {
    return this.contactsService.getContactById(req.user.sub, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new contact' })
  async createContact(@Request() req, @Body() data: CreateContactDto) {
    return this.contactsService.createContact(req.user.sub, data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contact' })
  async updateContact(
    @Request() req,
    @Param('id') id: number,
    @Body() data: UpdateContactDto,
  ) {
    return this.contactsService.updateContact(req.user.sub, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact' })
  async deleteContact(@Request() req, @Param('id') id: number) {
    return this.contactsService.deleteContact(req.user.sub, id);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync contacts from device' })
  async syncContacts(@Request() req, @Body() data: SyncContactsDto) {
    return this.contactsService.syncContacts(req.user.sub, data.contacts);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Toggle favorite status' })
  async toggleFavorite(@Request() req, @Param('id') id: number) {
    return this.contactsService.toggleFavorite(req.user.sub, id);
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Block contact' })
  async blockContact(@Request() req, @Param('id') id: number) {
    return this.contactsService.blockContact(req.user.sub, id);
  }

  @Post(':id/unblock')
  @ApiOperation({ summary: 'Unblock contact' })
  async unblockContact(@Request() req, @Param('id') id: number) {
    return this.contactsService.unblockContact(req.user.sub, id);
  }
}
