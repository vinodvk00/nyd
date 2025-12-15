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
  create(@Body() createAuditDto: CreateAuditDto) {
    return this.auditService.create(createAuditDto);
  }

  @Get()
  findAll(@Query('status') status?: AuditStatus) {
    return this.auditService.findAll(status);
  }

  @Get('active')
  findActive() {
    return this.auditService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const audit = await this.auditService.findOne(id);
    const stats = await this.auditService.getStats(id);

    return {
      ...audit,
      stats,
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuditDto: UpdateAuditDto) {
    return this.auditService.update(id, updateAuditDto);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.auditService.complete(id);
  }

  @Patch(':id/abandon')
  abandon(@Param('id') id: string) {
    return this.auditService.abandon(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auditService.remove(id);
  }
}
