import multer from 'multer';
import sharp from 'sharp';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {timingSafeEqual,createHash} from 'node:crypto';
import {z} from 'zod';
import Project from './models/Project.js';
import Unit from './models/Unit.js';
import Inquiry from './models/Inquiry.js';
import {id,projectInput,inquiryInput,projectQuery,pagination,escapeRegex} from './validation.js';
const fail=(status,message)=>Object.assign(new Error(message),{status});
export function createApp({adminKey,origins,uploadDir=path.resolve(fileURLToPath(new URL('../uploads',import.meta.url)))}) {
 const app=express();
 app.disable('x-powered-by');app.use(helmet());
 app.use(cors({origin(origin,cb){cb(origin && !origins.includes(origin)?fail(403,'Origin not allowed'):null,true);},methods:['GET','POST','PUT','DELETE','OPTIONS'],allowedHeaders:['Content-Type','Authorization']}));
 app.use('/uploads',express.static(uploadDir,{dotfiles:'deny',setHeaders(res){res.set('Cross-Origin-Resource-Policy','cross-origin');}}));
 app.use(express.json({limit:'32kb'}));
 app.use('/api',rateLimit({windowMs:15*60*1000,limit:300,standardHeaders:'draft-8',legacyHeaders:false}));
 const admin=(req,res,next)=>{
  const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1] || '';
  const hash=s=>createHash('sha256').update(s).digest();
  if(!adminKey || !token || !timingSafeEqual(hash(token),hash(adminKey))) return next(fail(401,'Admin authentication required'));
  res.set('Cache-Control','no-store');next();
 };
 const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:8*1024*1024,files:10,fields:0}});
 app.post('/api/uploads',admin,rateLimit({windowMs:15*60*1000,limit:20}),upload.array('images',10),async(req,res)=>{
  if(!req.files?.length)throw fail(400,'Select at least one image');
  const converted=[];
  for(const file of req.files){try{
   const decoder=sharp(file.buffer,{limitInputPixels:40000000});const meta=await decoder.metadata();
   if(!['jpeg','png','webp'].includes(meta.format))throw new Error('Unsupported image');
   converted.push(await decoder.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer());
  }catch{throw fail(400,'Only valid JPEG, PNG and WebP images are supported');}}
  await mkdir(uploadDir,{recursive:true});const saved=[];
  try{for(const buffer of converted){const name=randomUUID()+'.webp';const filePath=path.join(uploadDir,name);await writeFile(filePath,buffer,{flag:'wx'});saved.push(name);}}
  catch(e){await Promise.allSettled(saved.map(name=>unlink(path.join(uploadDir,name))));throw e;}
  res.status(201).json({success:true,data:saved.map(name=>'/uploads/'+name)});
 });
 const list=async(Model,filter,query,res,populate)=>{
  const {page,limit}=query;
  let q=Model.find(filter).sort({createdAt:-1,_id:-1}).skip((page-1)*limit).limit(limit);
  if(populate) q=q.populate(populate);
  const [data,total]=await Promise.all([q.lean(),Model.countDocuments(filter)]);
  res.json({success:true,data,pagination:{page,limit,total,pages:Math.ceil(total/limit)}});
 };
 app.get('/api/health',(req,res)=>res.json({success:true,message:'API running'}));
 app.get('/api/projects',async(req,res)=>{
  const query=projectQuery.parse(req.query);const filter={};
  for(const key of ['city','type','status']) if(query[key]) filter[key]=query[key];
  const term=query.name || query.search;if(term) filter.name={$regex:escapeRegex(term),$options:'i'};
  await list(Project,filter,query,res);
 });
 app.get('/api/projects/:id/units',async(req,res)=>{
  const projectId=id.parse(req.params.id);const query=z.strictObject(pagination).parse(req.query);
  if(!await Project.exists({_id:projectId})) throw fail(404,'Project not found');
  await list(Unit,{projectId},query,res);
 });
 app.get('/api/projects/:slug',async(req,res)=>{
  const data=await Project.findOne({slug:req.params.slug}).lean();
  if(!data) throw fail(404,'Project not found');res.json({success:true,data});
 });
 app.post('/api/projects',admin,async(req,res)=>{
  const data=await Project.create(projectInput.parse(req.body));res.status(201).json({success:true,data});
 });
 app.put('/api/projects/:id',admin,async(req,res)=>{
  const projectId=id.parse(req.params.id);
  const body=projectInput.partial().refine(v=>Object.keys(v).length>0,'At least one field required').parse(req.body);
  const data=await Project.findByIdAndUpdate(projectId,{$set:body},{new:true,runValidators:true});
  if(!data) throw fail(404,'Project not found');res.json({success:true,data});
 });
 app.delete('/api/projects/:id',admin,async(req,res)=>{
  const projectId=id.parse(req.params.id);
  // Preserve existing units and customer inquiry history. Delete only unreferenced projects.
  if(!await Project.exists({_id:projectId})) throw fail(404,'Project not found');
  if(await Unit.exists({projectId}) || await Inquiry.exists({projectId})) throw fail(409,'Project has units or inquiries; set status to sold_out instead');
  await Project.deleteOne({_id:projectId});res.status(204).end();
 });
 app.post('/api/inquiries',rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-8',legacyHeaders:false}),async(req,res)=>{
  const body=inquiryInput.parse(req.body);
  if(!await Project.exists({_id:body.projectId})) throw fail(404,'Project not found');
  const data=await Inquiry.create(body);
  res.status(201).json({success:true,data:{_id:data._id,createdAt:data.createdAt},message:'Inquiry received'});
 });
 app.get('/api/inquiries',admin,async(req,res)=>{
  const query=z.strictObject({...pagination,projectId:id.optional()}).parse(req.query);
  await list(Inquiry,query.projectId?{projectId:query.projectId}:{},query,res,{path:'projectId',select:'name slug city'});
 });
 app.use((req,res,next)=>next(fail(404,'Route not found')));
 app.use((err,req,res,next)=>{
  if(err instanceof multer.MulterError) return res.status(400).json({success:false,message:'Upload limit: 10 images, 8MB each'});
  if(err instanceof z.ZodError) return res.status(400).json({success:false,message:'Validation failed',errors:err.issues.map(x=>({field:x.path.join('.'),message:x.message}))});
  if(err.code===11000) return res.status(409).json({success:false,message:'Duplicate unique value',fields:Object.keys(err.keyPattern || {})});
  if(err.name==='ValidationError') return res.status(400).json({success:false,message:'Validation failed'});
  const status=err.status || 500;
  if(status>=500) console.error('Request failed:',err.name);
  res.status(status).json({success:false,message:status>=500?'Internal server error':status===400?'Invalid request':err.message});
 });return app;
}
