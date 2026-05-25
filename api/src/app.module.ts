import { Module } from '@nestjs/common';
import { CompilerModule } from './compiler.module';

@Module({
  imports: [CompilerModule],
})
export class AppModule {}
