import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TimeEntryService } from './time-entry.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { BatchCreateEntriesDto } from './dto/batch-create-entries.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('time-entries')
@UseGuards(JwtAuthGuard)
export class TimeEntryController {
  constructor(private readonly timeEntryService: TimeEntryService) {}

  @Post()
  create(@Body() createTimeEntryDto: CreateTimeEntryDto) {
    return this.timeEntryService.create(createTimeEntryDto);
  }

  @Post('batch')
  batchCreate(@Body() batchDto: BatchCreateEntriesDto) {
    return this.timeEntryService.batchCreate(batchDto);
  }

  @Get('audit/:auditId')
  findByAudit(@Param('auditId') auditId: string) {
    return this.timeEntryService.findByAudit(auditId);
  }

  @Get('audit/:auditId/day/:date')
  findByDay(@Param('auditId') auditId: string, @Param('date') date: string) {
    return this.timeEntryService.findByDay(auditId, date);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timeEntryService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateTimeEntryDto>,
  ) {
    return this.timeEntryService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timeEntryService.remove(id);
  }
}
