/** Reuse existing main registry and public inventory validation; no DB or publication writes. */
import {readFile,writeFile} from 'node:fs/promises';
import {summarizePublishedPhotoCoverage} from './photo-openverse-independent-batch.mjs';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('usage: inventory.json coverage.json');
const records=JSON.parse(await readFile(input,'utf8'));
const coverage=summarizePublishedPhotoCoverage(records);
await writeFile(output,JSON.stringify(coverage,null,2)+'\n');
console.log(JSON.stringify({total:coverage.total,missing:coverage.missing,registered:coverage.registered,publicationAuthorized:false}));
