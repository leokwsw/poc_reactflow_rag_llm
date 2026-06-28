import { join } from 'node:path';

export function envFilePaths() {
  return [
    join(process.cwd(), '.env'),
    join(process.cwd(), '..', '.env'),
  ];
}
