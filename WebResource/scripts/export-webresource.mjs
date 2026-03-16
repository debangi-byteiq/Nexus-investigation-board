import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const distIndex = resolve('dist', 'index.html');
const webResourceOutput = resolve('dist', 'ncs_NexusInvestigationBoard.html');

if (!existsSync(distIndex)) {
  console.error('Build output not found at dist/index.html. Run npm run build first.');
  process.exit(1);
}

copyFileSync(distIndex, webResourceOutput);
console.log(`Created Dataverse web resource artifact: ${webResourceOutput}`);
