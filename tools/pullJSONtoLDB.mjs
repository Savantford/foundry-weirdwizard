import { compilePack } from '@foundryvtt/foundryvtt-cli';
import { promises as fs } from 'fs';

const PACKAGE_ID = process.cwd();
const yaml = false;
const folders = true;

const packs = await fs.readdir('./src/packs');
for (const pack of packs) {
  if (pack === '.gitattributes') continue;
  console.log('Packing ' + pack);
  await compilePack(
    `${PACKAGE_ID}/src/packs/${pack}`,
    `${PACKAGE_ID}/packs/${pack}`,
    { yaml, recursive: folders }
  );
}