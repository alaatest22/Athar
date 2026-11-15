import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import request from 'supertest';
import {createApp} from '../src/app.js';
import {projectInput} from '../src/validation.js';
test('Authenticated upload validates bytes, converts to WebP and serves images safely',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'athar-upload-'));const app=createApp({adminKey:'upload-test-key',origins:['http://localhost:5173'],uploadDir:dir});
 try{
  await request(app).post('/api/uploads').attach('images',Buffer.from('test'),'test.jpg').expect(401);
  await request(app).post('/api/uploads').set('Authorization','Bearer upload-test-key').attach('images',Buffer.from('<script>bad</script>'),'bad.jpg').expect(400);
  assert.equal((await readdir(dir)).length,0);
  const jpg=await sharp({create:{width:20,height:20,channels:3,background:'#835b3e'}}).jpeg().toBuffer();
  const result=await request(app).post('/api/uploads').set('Authorization','Bearer upload-test-key').attach('images',jpg,'photo.jpg').expect(201);
  assert.match(result.body.data[0],/^\/uploads\/[a-f0-9-]+\.webp$/);
  const image=await request(app).get(result.body.data[0]).expect(200);assert.match(image.headers['content-type'],/image\/webp/);assert.equal(image.headers['cross-origin-resource-policy'],'cross-origin');
  assert.equal(projectInput.shape.image.safeParse(result.body.data[0]).success,true);
  assert.equal(projectInput.shape.image.safeParse('/uploads/../secrets').success,false);
  assert.equal(projectInput.shape.image.safeParse('javascript:alert(1)').success,false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
