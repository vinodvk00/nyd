import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ActivityTemplate } from './entities/activity-template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class ActivityTemplateService {
  constructor(
    @InjectRepository(ActivityTemplate)
    private templateRepository: Repository<ActivityTemplate>,
  ) {}

  async create(createTemplateDto: CreateTemplateDto): Promise<ActivityTemplate> {
    const template = this.templateRepository.create({
      ...createTemplateDto,
      isDefault: false,
    });

    return this.templateRepository.save(template);
  }

  async findAll(): Promise<ActivityTemplate[]> {
    return this.templateRepository.find({
      order: { isDefault: 'DESC', name: 'ASC' },
    });
  }

  async findDefaults(): Promise<ActivityTemplate[]> {
    return this.templateRepository.find({
      where: { isDefault: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async search(query: string): Promise<ActivityTemplate[]> {
    return this.templateRepository.find({
      where: { name: Like(`%${query}%`) },
      order: { isDefault: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ActivityTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async update(
    id: string,
    updateDto: Partial<CreateTemplateDto>,
  ): Promise<ActivityTemplate> {
    const template = await this.findOne(id);

    Object.assign(template, updateDto);

    return this.templateRepository.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);

    if (template.isDefault) {
      throw new NotFoundException('Cannot delete default templates');
    }

    await this.templateRepository.remove(template);
  }

  async seedDefaults(): Promise<void> {
    const existing = await this.templateRepository.count({
      where: { isDefault: true },
    });

    if (existing > 0) {
      return; // Already seeded
    }

    const defaults = [
      {
        name: 'Sleep',
        description: 'Rest and sleep',
        isImportant: true,
        isUrgent: false,
        category: 'Health',
        icon: '😴',
        isDefault: true,
      },
      {
        name: 'Meals',
        description: 'Breakfast, lunch, dinner, snacks',
        isImportant: true,
        isUrgent: false,
        category: 'Health',
        icon: '🍽️',
        isDefault: true,
      },
      {
        name: 'Exercise',
        description: 'Physical activity, workouts, sports',
        isImportant: true,
        isUrgent: false,
        category: 'Health',
        icon: '💪',
        isDefault: true,
      },
      {
        name: 'NYD.LIFE Development',
        description: 'Working on NYD.LIFE project',
        isImportant: true,
        isUrgent: false,
        category: 'Work',
        icon: '💻',
        isDefault: true,
      },
      {
        name: 'College/Class',
        description: 'Attending classes, lectures',
        isImportant: true,
        isUrgent: true,
        category: 'Education',
        icon: '🎓',
        isDefault: true,
      },
      {
        name: 'Deep Work/Learning',
        description: 'Focused study, learning new skills',
        isImportant: true,
        isUrgent: false,
        category: 'Growth',
        icon: '📚',
        isDefault: true,
      },
      {
        name: 'Social Media Scrolling',
        description: 'Instagram, Twitter, etc.',
        isImportant: false,
        isUrgent: false,
        category: 'Waste',
        icon: '📱',
        isDefault: true,
      },
      {
        name: 'YouTube/Netflix',
        description: 'Watching videos, streaming',
        isImportant: false,
        isUrgent: false,
        category: 'Leisure',
        icon: '📺',
        isDefault: true,
      },
      {
        name: 'Meetings (Unproductive)',
        description: 'Meetings that could have been emails',
        isImportant: false,
        isUrgent: true,
        category: 'Interruption',
        icon: '💬',
        isDefault: true,
      },
      {
        name: 'Email/Messages',
        description: 'Checking and responding to messages',
        isImportant: false,
        isUrgent: true,
        category: 'Communication',
        icon: '✉️',
        isDefault: true,
      },
    ];

    await this.templateRepository.save(defaults);
  }
}
