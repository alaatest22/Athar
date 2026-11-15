import mongoose from 'mongoose';
import env from './config.js';
import {createApp} from './app.js';
try {
 await mongoose.connect(env.MONGODB_URI,{serverSelectionTimeoutMS:10000});
 const app=createApp({adminKey:env.ADMIN_API_KEY,origins:env.CORS_ORIGIN.split(',').map(x=>x.trim())});
 const server=app.listen(env.PORT,()=>console.log(`API: http://localhost:${env.PORT}`));
 const stop=()=>{server.close(async()=>{await mongoose.disconnect();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();};
 process.on('SIGINT',stop);process.on('SIGTERM',stop);
 server.on('error',()=>{console.error('Server failed to listen');process.exit(1);});
} catch {console.error('Database connection failed. Check MONGODB_URI and MongoDB availability.');process.exit(1);}
