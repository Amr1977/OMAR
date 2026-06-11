import fs from 'fs';
import path from 'path';

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')
);

export const getVersion = (_req: any, res: any) => {
  res.json({ version: pkg.version });
};
