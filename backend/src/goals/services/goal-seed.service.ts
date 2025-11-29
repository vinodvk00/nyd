import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AreaService } from './area.service';
import { CategoryService } from './category.service';
import { GoalService } from './goal.service';
import { GoalPriority, TargetPeriod } from '../entities/goal.entity';

@Injectable()
export class GoalSeedService implements OnModuleInit {
  private readonly logger = new Logger(GoalSeedService.name);

  constructor(
    private readonly areaService: AreaService,
    private readonly categoryService: CategoryService,
    private readonly goalService: GoalService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultGoals();
  }

  async seedDefaultGoals() {
    try {
      this.logger.log('Checking for existing goals...');

      const existingAreas = await this.areaService.findAll();
      if (existingAreas.length > 0) {
        this.logger.log(
          `Found ${existingAreas.length} existing areas. Skipping seed.`,
        );
        return;
      }

      this.logger.log('Seeding default goal structure...');

      const programmingArea = await this.areaService.create({
        name: 'Programming',
        icon: '📁',
        order: 1,
      });
      this.logger.log(`Created area: ${programmingArea.name}`);

      const dsaCategory = await this.categoryService.create({
        name: 'DSA',
        areaId: programmingArea.id,
        order: 1,
      });

      await this.goalService.create({
        name: 'LeetCode Interview Prep',
        purpose:
          'Complete Striver 79 → Striver SDE sheet. Goal: Make DSA problem-solving second nature.',
        priority: GoalPriority.CRITICAL,
        targetHours: 20,
        targetPeriod: TargetPeriod.WEEKLY,
        tags: ['DSA-Practice', 'Leetcode', 'Coding', 'Interview-Prep'],
        categoryId: dsaCategory.id,
      });

      await this.goalService.create({
        name: 'Competitive Programming',
        purpose: 'Regular contest participation for speed and pattern recognition',
        priority: GoalPriority.GROWTH,
        targetHours: 5,
        targetPeriod: TargetPeriod.WEEKLY,
        tags: ['DSA-Contest', 'Codeforces', 'AtCoder'],
        categoryId: dsaCategory.id,
      });

      const foundationsCategory = await this.categoryService.create({
        name: 'Foundations',
        areaId: programmingArea.id,
        order: 2,
      });

      await this.goalService.create({
        name: 'Language Mastery',
        purpose: 'Deep understanding of language internals and best practices',
        priority: GoalPriority.IMPORTANT,
        targetHours: 10,
        targetPeriod: TargetPeriod.WEEKLY,
        tags: ['Language-Learning', 'JavaScript', 'TypeScript', 'Python'],
        categoryId: foundationsCategory.id,
      });

      const developmentArea = await this.areaService.create({
        name: 'Development',
        icon: '📁',
        order: 2,
      });

      const backendCategory = await this.categoryService.create({
        name: 'Backend',
        areaId: developmentArea.id,
        order: 1,
      });

      await this.goalService.create({
        name: 'Backend Mastery',
        purpose: 'Build production-grade backend systems with confidence',
        priority: GoalPriority.IMPORTANT,
        targetHours: 12,
        targetPeriod: TargetPeriod.WEEKLY,
        tags: ['Backend-Dev', 'Node.js', 'NestJS', 'API-Design'],
        categoryId: backendCategory.id,
      });

      await this.goalService.create({
        name: 'Database Skills',
        purpose: 'Master database design, optimization, and management',
        priority: GoalPriority.IMPORTANT,
        targetHours: 6,
        targetPeriod: TargetPeriod.WEEKLY,
        tags: ['Database', 'PostgreSQL', 'SQL', 'Query-Optimization'],
        categoryId: backendCategory.id,
      });

      const devopsCategory = await this.categoryService.create({
        name: 'DevOps',
        areaId: developmentArea.id,
        order: 2,
      });

      await this.goalService.create({
        name: 'CI/CD Understanding',
        purpose: 'Set up automated pipelines and understand deployment workflows',
        priority: GoalPriority.GROWTH,
        targetHours: 5,
        targetPeriod: TargetPeriod.WEEKLY,
        tags: ['DevOps', 'CI-CD', 'Docker', 'GitHub-Actions'],
        categoryId: devopsCategory.id,
      });

      const qualityCategory = await this.categoryService.create({
        name: 'Quality',
        areaId: developmentArea.id,
        order: 3,
      });

      await this.goalService.create({
        name: 'Testing Skills',
        purpose: 'Write meaningful tests that catch real bugs and document behavior',
        priority: GoalPriority.IMPORTANT,
        targetHours: 8,
        targetPeriod: TargetPeriod.WEEKLY,
        tags: ['Testing-Learning', 'Jest', 'TDD', 'E2E-Testing'],
        categoryId: qualityCategory.id,
      });

      const hobbiesArea = await this.areaService.create({
        name: 'Hobbies',
        icon: '📁',
        order: 3,
      });

      const fitnessCategory = await this.categoryService.create({
        name: 'Fitness',
        areaId: hobbiesArea.id,
        order: 1,
      });

      await this.goalService.create({
        name: 'Calisthenics',
        purpose: 'Build strength and mobility through bodyweight training',
        priority: GoalPriority.HOBBY,
        targetHours: 7,
        targetPeriod: TargetPeriod.WEEKLY,
        minimumDaily: 0.5, // At least 30 min daily
        tags: ['Fitness', 'Calisthenics', 'Workout'],
        categoryId: fitnessCategory.id,
      });

      const learningCategory = await this.categoryService.create({
        name: 'Learning',
        areaId: hobbiesArea.id,
        order: 2,
      });

      await this.goalService.create({
        name: 'Reading',
        purpose: 'Continuous learning through books on tech, business, and personal growth',
        priority: GoalPriority.HOBBY,
        targetHours: 5,
        targetPeriod: TargetPeriod.WEEKLY,
        tags: ['Reading', 'Books', 'Learning'],
        categoryId: learningCategory.id,
      });

      this.logger.log('Default goal structure seeded successfully!');
    } catch (error) {
      this.logger.error(`Error seeding goals: ${error.message}`);
    }
  }
}
