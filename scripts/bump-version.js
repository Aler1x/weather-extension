import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const pkgPath = resolve('package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

const parts = pkg.version.split('.').map(Number);
parts[2]++;
pkg.version = parts.join('.');

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`version → ${pkg.version}`);
