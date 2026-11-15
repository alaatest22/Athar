import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const path=new URL('../.env',import.meta.url);
let env=readFileSync(existsSync(path)?path:new URL('../.env.example',import.meta.url),'utf8');
if(!env.includes('CHANGE_ME')){console.log('.env already configured; preserved.');process.exit(0);}
env=env.replace(/^ADMIN_API_KEY=.*$/m,'ADMIN_API_KEY='+randomBytes(32).toString('hex'));
writeFileSync(path,env,{mode:0o600});console.log('.env configured. Keep ADMIN_API_KEY private.');
