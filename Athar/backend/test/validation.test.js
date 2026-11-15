import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {projectQuery,inquiryInput,projectInput,escapeRegex} from '../src/validation.js';
import {createApp} from '../src/app.js';
test('Validation rejects operator injection, invalid pagination and invalid inquiries',()=>{
 assert.equal(projectQuery.safeParse({city:{$ne:''}}).success,false);
 assert.equal(projectQuery.safeParse({limit:101}).success,false);
 assert.equal(projectQuery.safeParse({page:0}).success,false);
 assert.equal(inquiryInput.safeParse({name:'Test',phone:'bad',projectId:'bad',message:'hi'}).success,false);
 assert.equal(escapeRegex('.*[a]'),'\\.\\*\\[a\\]');
 assert.deepEqual(projectInput.partial().parse({priceFrom:200}),{priceFrom:200});
});
test('HTTP health, admin authorization, CORS and malformed payloads',async()=>{
 const app=createApp({adminKey:'test-secret',origins:['http://localhost:5173']});
 await request(app).get('/api/health').expect(200);
 await request(app).get('/api/inquiries').expect(401);
 await request(app).post('/api/projects').send({}).expect(401);
 await request(app).get('/api/projects').set('Origin','https://evil.example').expect(403);
 await request(app).options('/api/projects').set('Origin','http://localhost:5173').set('Access-Control-Request-Method','POST').expect(204);
 await request(app).post('/api/inquiries').set('Content-Type','application/json').send('{').expect(400);
 await request(app).get('/api/projects?limit=1000').expect(400);
 await request(app).get('/api/projects/not-id/units').expect(400);
});
