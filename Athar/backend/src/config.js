import 'dotenv/config';
import {z} from 'zod';
const env=z.object({PORT:z.coerce.number().int().min(1).max(65535).default(5000),MONGODB_URI:z.string().min(1),ADMIN_API_KEY:z.string().min(32),CORS_ORIGIN:z.string().min(1),NODE_ENV:z.enum(['development','test','production']).default('development')}).parse(process.env);
if(env.ADMIN_API_KEY.includes('CHANGE_ME')) throw new Error('Generate ADMIN_API_KEY first (see README)');
export default env;
