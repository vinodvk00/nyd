import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ActivityTemplateService } from './activity-template.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Controller('templates')
export class ActivityTemplateController {
  constructor(
    private readonly activityTemplateService: ActivityTemplateService,
  ) {}

  @Post()
  create(@Body() createTemplateDto: CreateTemplateDto) {
    return this.activityTemplateService.create(createTemplateDto);
  }

  @Get()
  findAll() {
    return this.activityTemplateService.findAll();
  }

  @Get('defaults')
  findDefaults() {
    return this.activityTemplateService.findDefaults();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.activityTemplateService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activityTemplateService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateTemplateDto>,
  ) {
    return this.activityTemplateService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activityTemplateService.remove(id);
  }
}
