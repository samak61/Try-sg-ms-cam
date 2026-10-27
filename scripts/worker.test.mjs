import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,readdir} from 'node:fs/promises';
import worker from '../workers/camera-worker.js';
const env={CAMERA_NAME:'Sea Girt Center',SOURCE_URL:'https://seagirt.cdn.coastalcameranetwork.com/New_Jersey/seagirt.stream/index.m3u8'};
const originalFetch=globalThis.fetch;
const get=(path,customEnv=env)=>worker.fetch(new Request('https://camera.example'+path),customEnv);
test('worker confines requests, rewrites playlists, preserves access denials and serves parseable player',async()=>{
 let calls=0;globalThis.fetch=async(_url,options)=>{calls++;assert.equal(options.redirect,'manual');assert.equal(options.headers.has('Referer'),false);assert.equal(options.headers.has('Origin'),false);return new Response('#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\nsegment.ts\n',{headers:{'Content-Type':'application/vnd.apple.mpegurl'}});};
 try{
  for(const url of ['https://example.com/x.m3u8','http://seagirt.cdn.coastalcameranetwork.com/New_Jersey/seagirt.stream/index.m3u8','https://seagirt.cdn.coastalcameranetwork.com/private/index.m3u8','https://user:pass@seagirt.cdn.coastalcameranetwork.com/New_Jersey/seagirt.stream/index.m3u8']){assert.equal((await get('/stream?url='+encodeURIComponent(url))).status,403);}assert.equal(calls,0);
  let r=await get('/stream');assert.equal(r.status,200);const text=await r.text();assert.match(text,/URI="\/stream\?url=/);assert.match(text,/%2Fsegment.ts/);assert.match(text,/%2Fkey.bin/);
  globalThis.fetch=async()=>new Response('denied',{status:403});assert.equal((await get('/stream')).status,403);
  globalThis.fetch=async()=>new Response(null,{status:302,headers:{Location:'https://example.com/private'}});assert.equal((await get('/stream')).status,502);
  r=await get('/');assert.equal(r.status,200);const markup=await r.text();assert.match(markup,/Sea Girt Center/);for(const match of markup.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
  assert.equal((await get('/?url='+encodeURIComponent('https://example.com/x.m3u8'))).status,403);
 }finally{globalThis.fetch=originalFetch;}
});
test('nine tiles preserve the existing Worker and create exactly eight others',async()=>{const cameras=JSON.parse(await readFile(new URL('../cameras.json',import.meta.url),'utf8'));assert.equal(cameras.length,9);assert.equal(cameras.filter(c=>c.existing).length,1);assert.equal(new Set(cameras.filter(c=>!c.existing).map(c=>c.worker)).size,8);const source=await readFile(new URL('../camera-grid/cameras.js',import.meta.url),'utf8');const sandbox={window:{}};vm.runInNewContext(source,sandbox);assert.equal(sandbox.window.CAMERA_DEFAULTS.length,9);assert.match(sandbox.window.CAMERA_DEFAULTS[4].url,/^https:\/\/sea-girt-north1\.wail-dorado7m\.workers\.dev\//);const configs=await readdir(new URL('../workers/configs/',import.meta.url));assert.equal(configs.length,8);});
