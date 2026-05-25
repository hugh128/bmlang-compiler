import {
  Controller, Post, Body, Get,
  UploadedFile, UseInterceptors,
  HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { FileInterceptor }      from '@nestjs/platform-express';
import { diskStorage }          from 'multer';
import * as path from 'path';
import * as fs   from 'fs';
import * as os   from 'os';
import { CompilerService, CompileResult, COMPILER_BIN } from './compiler.service';

class CompileDto {
  @IsString()
  @IsNotEmpty({ message: 'El campo "code" no puede estar vacío' })
  code!: string;
}

@Controller('compiler')
export class CompilerController {
  constructor(private readonly compilerService: CompilerService) {}

  /* GET /api/compiler/health */
  @Get('health')
  health() {
    const available = fs.existsSync(COMPILER_BIN);
    return {
      status:    available ? 'ok' : 'error',
      compiler:  COMPILER_BIN,
      available,
      message:   available
        ? 'Compilador BMLang disponible'
        : `Binario no encontrado en: ${COMPILER_BIN} — ejecuta "make" en la carpeta compiler/`,
    };
  }

  /* GET /api/compiler/diagnostics */
  @Get('diagnostics')
  diagnostics() {
    return this.compilerService.getDiagnostics();
  }

  /* POST /api/compiler/compile */
  @Post('compile')
  @HttpCode(HttpStatus.OK)
  async compile(@Body() body: CompileDto): Promise<CompileResult> {
    return this.compilerService.compile(body.code);
  }

  /* POST /api/compiler/compile-file */
  @Post('compile-file')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: os.tmpdir(),
        filename: (_req, file, cb) =>
          cb(null, `bmlang_upload_${Date.now()}${path.extname(file.originalname)}`),
      }),
      fileFilter: (_req, file, cb) => {
        if (path.extname(file.originalname) !== '.ml')
          return cb(new BadRequestException('Solo se aceptan archivos .ml'), false);
        cb(null, true);
      },
      limits: { fileSize: 1_048_576 },
    }),
  )
  async compileFile(@UploadedFile() file: Express.Multer.File): Promise<CompileResult> {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    try {
      return await this.compilerService.compileFile(file.path);
    } finally {
      try { fs.unlinkSync(file.path); } catch { }
    }
  }
}
