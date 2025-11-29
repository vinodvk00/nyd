import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from '../entities/area.entity';
import { CreateAreaDto } from '../dto/create-area.dto';
import { UpdateAreaDto } from '../dto/update-area.dto';

@Injectable()
export class AreaService {
  constructor(
    @InjectRepository(Area)
    private areaRepository: Repository<Area>,
  ) {}

  async create(createAreaDto: CreateAreaDto): Promise<Area> {
    const area = this.areaRepository.create(createAreaDto);
    return this.areaRepository.save(area);
  }

  async findAll(): Promise<Area[]> {
    return this.areaRepository.find({
      relations: ['categories', 'categories.goals'],
      order: {
        order: 'ASC',
        categories: {
          order: 'ASC',
        },
      },
    });
  }

  async findOne(id: number): Promise<Area> {
    const area = await this.areaRepository.findOne({
      where: { id },
      relations: ['categories', 'categories.goals'],
    });

    if (!area) {
      throw new NotFoundException(`Area with ID ${id} not found`);
    }

    return area;
  }

  async update(id: number, updateAreaDto: UpdateAreaDto): Promise<Area> {
    const area = await this.findOne(id);
    Object.assign(area, updateAreaDto);
    return this.areaRepository.save(area);
  }

  async remove(id: number): Promise<void> {
    const area = await this.findOne(id);
    await this.areaRepository.remove(area);
  }
}
