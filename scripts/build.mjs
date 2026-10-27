import worker from '../workers/camera-worker.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const cameras=JSON.parse(await readFile(new URL('cameras.json',root),'utf8'));
const subdomain=process.env.WORKERS_SUBDOMAIN||'wail-dorado7m';
if(!/^[a-z0-9-]+$/.test(subdomain))throw Error('WORKERS_SUBDOMAIN must be your Cloudflare workers.dev subdomain.');
const output=[];
for(const c of cameras){
 if(c.existing){output.push({name:c.name,url:c.url,page:c.page,external:true});continue;}
 const dir=new URL(`workers/configs/${c.id}/`,root);await mkdir(dir,{recursive:true});
 await writeFile(new URL('wrangler.json',dir),JSON.stringify({name:c.worker,main:'../../camera-worker.js',compatibility_date:'2026-10-27',workers_dev:true,vars:{CAMERA_NAME:c.name,SOURCE_URL:c.source}},null,2)+'\n');
 output.push({name:c.name,url:`https://${c.worker}.${subdomain}.workers.dev/`,page:c.page,external:false});
}
await writeFile(new URL('camera-grid/cameras.js',root),'window.CAMERA_DEFAULTS = '+JSON.stringify(output,null,2)+';\n');
await writeFile(new URL('camera-grid/.nojekyll',root),'');
console.log('Prepared nine camera tiles, eight new Worker configurations, and the existing Sea Girt North URL.');

const existing=cameras.find(c=>c.existing);
const upstream=new URL(existing.url).searchParams.get('url');
const markup=await (await worker.fetch(new Request('https://player.example/'),{CAMERA_NAME:existing.name,SOURCE_URL:upstream})).text();
const playerMarkup=markup.replace(/const source=.*?,v=document/, 'const source='+JSON.stringify(existing.url)+',v=document');
await writeFile(new URL('camera-grid/existing-player.html',root),playerMarkup);
