import { Injectable, Logger } from '@nestjs/common';
import { execFile }           from 'child_process';
import * as fs                from 'fs';
import * as path              from 'path';
import * as os                from 'os';

function resolveCompilerBin(): string {
  // Variable de entorno con ruta del binario bmlang
  if (process.env.BMLANG_BIN) {
    return path.resolve(process.env.BMLANG_BIN);
  }

  // Relativa a cwd
  const fromCwd = path.resolve(process.cwd(), '../compiler/bin/bmlang');
  if (fs.existsSync(fromCwd)) return fromCwd;

  // Relativa a __dirname (api/dist/compiler/)
  const fromDirname = path.resolve(__dirname, '../../../compiler/bin/bmlang');
  if (fs.existsSync(fromDirname)) return fromDirname;

  return fromCwd;
}

export const COMPILER_BIN = resolveCompilerBin();

export interface CompileResult {
  success:  boolean;
  output:   string;
  errors:   string;
  duration: number;
}

function extractErrors(stderr: string): string {
  return stderr
    .split('\n')
    .filter(l => /^Error\s+(sintactico|lexico)\b/i.test(l.trim()))
    .join('\n')
    .trim();
}

@Injectable()
export class CompilerService {
  private readonly log = new Logger(CompilerService.name);

  constructor() {
    this.log.log(`Binario BMLang: ${COMPILER_BIN}`);
    this.log.log(`Existe: ${fs.existsSync(COMPILER_BIN)}`);
    this.log.log(`cwd: ${process.cwd()}`);
  }

  async compile(sourceCode: string): Promise<CompileResult> {
    const start   = Date.now();
    const tmpFile = path.join(
      os.tmpdir(),
      `bmlang_${Date.now()}_${Math.random().toString(36).slice(2)}.ml`,
    );
    try {
      fs.writeFileSync(tmpFile, sourceCode, 'utf8');
      return await this._exec(tmpFile, start);
    } finally {
      try { fs.unlinkSync(tmpFile); } catch { }
    }
  }

  async compileFile(filePath: string): Promise<CompileResult> {
    return this._exec(filePath, Date.now());
  }

  private _exec(filePath: string, start: number): Promise<CompileResult> {
    return new Promise((resolve) => {
      execFile(
        COMPILER_BIN,
        [filePath],
        { timeout: 10_000 },
        (err, stdout, stderr) => {
          const success        = !err;
          const errorsFiltered = extractErrors(stderr);

          this.log.log(
            `file=${path.basename(filePath)}  ` +
            `exit=${success ? 0 : (err as any)?.code ?? '?'}  ` +
            `stdout=${stdout.length}b  ` +
            `stderr_raw=${JSON.stringify(stderr.trim().slice(0, 200))}  ` +
            `errors_clean=${JSON.stringify(errorsFiltered)}`,
          );

          resolve({
            success,
            output:   stdout,
            errors:   errorsFiltered,
            duration: Date.now() - start,
          });
        },
      );
    });
  }

  getDiagnostics() {
    return {
      compiler_bin:    COMPILER_BIN,
      compiler_exists: fs.existsSync(COMPILER_BIN),
      cwd:             process.cwd(),
      dirname:         __dirname,
      node_version:    process.version,
      platform:        process.platform,
      env_BMLANG_BIN:  process.env.BMLANG_BIN ?? '(no definido)',
    };
  }
}
