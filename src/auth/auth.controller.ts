import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthGuard } from './guards/register-auth.guard';
import { UserResponseDto } from 'src/users/dtos/user-response.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';
import { LoginAuthGuard } from './guards/login-auth.guard';
import { ProfileWithTokensDto } from './dtos/profile-with-tokens.dto';
import { AccessTokenAuthGuard } from './guards/access-token-auth.guard';
import { UploadFileInterceptor } from 'src/core/interceptors/upload-file.interceptor';
import { UpdateUserDto } from 'src/users/dtos/update-user.dto';
import { RefreshTokenAuthGuard } from './guards/refresh-token-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register
  @Post('register')
  @UseGuards(RegisterAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  register(@CurrentUser() user: User) {
    return new UserResponseDto(user);
  }

  // POST /auth/login
  @Post('login')
  @UseGuards(LoginAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async login(@CurrentUser() user: User) {
    const profileWithTokens =
      await this.authService.generateProfileWithTokens(user);

    return new ProfileWithTokensDto(profileWithTokens);
  }

  // POST /auth/refresh-token
  @Post('refresh-token')
  @UseGuards(RefreshTokenAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async refreshToken(@CurrentUser() user: User) {
    const profileWithTokens =
      await this.authService.generateProfileWithTokens(user);

    return new ProfileWithTokensDto(profileWithTokens);
  }

  // GET /auth/profile
  @Get('profile')
  @UseGuards(AccessTokenAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    const profile = await this.authService.getProfile(user.id);

    return new UserResponseDto(profile);
  }

  // PATCH /auth/profile
  @Patch('profile')
  @UploadFileInterceptor('image', { destination: 'uploads/users' })
  @UseGuards(AccessTokenAuthGuard)
  async updateProfile(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body() form: Omit<UpdateUserDto, 'image'>,
  ) {
    const profile = await this.authService.updateProfile(user.id, {
      ...form,
      image: file.filename,
    });

    return new UserResponseDto(profile);
  }

  // DELETE /auth/logout
  @Delete('logout')
  @UseGuards(AccessTokenAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }
}
