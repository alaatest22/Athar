import {z} from 'zod';
export const id=z.string().regex(/^[a-f\d]{24}$/i,'Invalid MongoDB ID');
const imagePath=z.union([z.url().refine(v=>/^https?:\/\//.test(v),'HTTP URL required'),z.string().regex(/^\/uploads\/[a-f0-9-]+\.webp$/)]);
const text=(max)=>z.string().trim().min(1).max(max);
export const projectInput=z.strictObject({
 name:text(150),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(150),city:text(100),
 type:z.enum(['villa','apartment','townhouse','mixed']),status:z.enum(['upcoming','under_construction','ready','sold_out']),
 priceFrom:z.number().finite().min(0),totalUnits:z.number().int().min(0),image:imagePath,gallery:z.array(imagePath).max(10).optional(),
 description:text(10000),location:z.strictObject({address:text(300),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180)}),features:z.array(text(100)).max(50)
});
export const inquiryInput=z.strictObject({name:text(120),phone:z.string().trim().regex(/^\+?[\d ()-]{7,20}$/),email:z.email().max(254).optional(),projectId:id,message:text(3000)});
export const pagination={page:z.coerce.number().int().min(1).max(100000).default(1),limit:z.coerce.number().int().min(1).max(100).default(12)};
export const projectQuery=z.strictObject({...pagination,city:text(100).optional(),type:projectInput.shape.type.optional(),status:projectInput.shape.status.optional(),name:text(150).optional(),search:text(150).optional()});
export const escapeRegex=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
