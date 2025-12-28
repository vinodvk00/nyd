import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AreaService } from '../services/area.service';
import { CreateAreaDto } from '../dto/create-area.dto';
import { UpdateAreaDto } from '../dto/update-area.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('areas')
@UseGuards(JwtAuthGuard)
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Post()
  create(@Request() req, @Body() createAreaDto: CreateAreaDto) {
    return this.areaService.create(req.user.userId, createAreaDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.areaService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.areaService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAreaDto: UpdateAreaDto,
  ) {
    return this.areaService.update(id, req.user.userId, updateAreaDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.areaService.remove(id, req.user.userId);
  }
}
