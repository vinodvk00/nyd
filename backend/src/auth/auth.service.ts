import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MagicLinkToken } from './entities/magic-link-token.entity';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(MagicLinkToken)
    private magicLinkTokenRepository: Repository<MagicLinkToken>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async generateRefreshToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      isRevoked: false,
    });

    await this.refreshTokenRepository.save(refreshToken);
    return token;
  }

  async validateRefreshToken(token: string): Promise<User | null> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!refreshToken) {
      return null;
    }

    if (refreshToken.isRevoked) {
      return null;
    }

    if (new Date() > refreshToken.expiresAt) {
      return null;
    }

    return refreshToken.user;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { token },
      { isRevoked: true },
    );
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async refreshAccessToken(refreshToken: string) {
    const user = await this.validateRefreshToken(refreshToken);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    await this.revokeRefreshToken(refreshToken);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      name: createUserDto.name,
    });

    await this.userRepository.save(user);

    const { password, ...result } = user;
    return result;
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    return result;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return;
    }

    const recentToken = await this.passwordResetTokenRepository.findOne({
      where: {
        userId: user.id,
        used: false,
        createdAt: MoreThan(new Date(Date.now() - 60 * 1000)),
      },
    });

    if (recentToken) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const resetToken = this.passwordResetTokenRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });

    await this.passwordResetTokenRepository.save(resetToken);
    await this.mailService.sendPasswordReset(email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token, used: false },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(resetToken.userId, { password: hashedPassword });

    resetToken.used = true;
    await this.passwordResetTokenRepository.save(resetToken);

    await this.revokeAllUserTokens(resetToken.userId);
  }

  async validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token, used: false },
      relations: ['user'],
    });

    if (!resetToken || new Date() > resetToken.expiresAt) {
      return { valid: false };
    }

    return { valid: true, email: resetToken.user.email };
  }

  async sendMagicLink(email: string, name?: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({ where: { email } });

    const recentToken = await this.magicLinkTokenRepository.findOne({
      where: {
        email,
        used: false,
        createdAt: MoreThan(new Date(Date.now() - 60 * 1000)),
      },
    });

    if (recentToken) {
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const magicLinkToken = this.magicLinkTokenRepository.create({
      token,
      email,
      name: existingUser ? existingUser.name : name,
      userId: existingUser?.id,
      expiresAt,
    });

    await this.magicLinkTokenRepository.save(magicLinkToken);
    await this.mailService.sendMagicLink(email, token, !existingUser);
  }

  async verifyMagicLink(token: string): Promise<{
    access_token: string;
    refresh_token: string;
    user: { id: number; email: string; name: string };
  }> {
    const magicLinkToken = await this.magicLinkTokenRepository.findOne({
      where: { token, used: false },
    });

    if (!magicLinkToken) {
      throw new BadRequestException('Invalid or expired link');
    }

    if (new Date() > magicLinkToken.expiresAt) {
      throw new BadRequestException('Link has expired');
    }

    let user: User | null = null;

    if (magicLinkToken.userId) {
      user = await this.userRepository.findOne({ where: { id: magicLinkToken.userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }
    } else {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = this.userRepository.create({
        email: magicLinkToken.email,
        password: hashedPassword,
        name: magicLinkToken.name || magicLinkToken.email.split('@')[0],
      });

      await this.userRepository.save(user);
    }

    if (!user) {
      throw new BadRequestException('Failed to create or find user');
    }

    magicLinkToken.used = true;
    await this.magicLinkTokenRepository.save(magicLinkToken);

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
