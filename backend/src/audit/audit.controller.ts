import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { AuditStatus } from './entities/audit.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('audits')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  create(@Request() req, @Body() createAuditDto: CreateAuditDto) {
    return this.auditService.create(req.user.userId, createAuditDto);
  }

  @Get()
  findAll(@Request() req, @Query('status') status?: AuditStatus) {
    return this.auditService.findAll(req.user.userId, status);
  }

  @Get('active')
  findActive(@Request() req) {
    return this.auditService.findActive(req.user.userId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const audit = await this.auditService.findOne(id, req.user.userId);
    const stats = await this.auditService.getStats(id, req.user.userId);

    return {
      ...audit,
      stats,
    };
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateAuditDto: UpdateAuditDto) {
    return this.auditService.update(id, req.user.userId, updateAuditDto);
  }

  @Patch(':id/complete')
  complete(@Request() req, @Param('id') id: string) {
    return this.auditService.complete(id, req.user.userId);
  }

  @Patch(':id/abandon')
  abandon(@Request() req, @Param('id') id: string) {
    return this.auditService.abandon(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.auditService.remove(id, req.user.userId);
  }
}
