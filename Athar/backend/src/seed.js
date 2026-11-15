import mongoose from 'mongoose';
import env from './config.js';
import Project from './models/Project.js';
import Unit from './models/Unit.js';
const rows=[
 ['نساج التجريبي','nesaj-demo','الدمام','villa',1200000,26.4207,50.0888],
 ['إيوان التجريبي','ewan-demo','الرياض','townhouse',980000,24.7136,46.6753],
 ['رتال ريزيدنس التجريبي','retal-residence-demo','الخبر','apartment',720000,26.2172,50.1971],
 ['نساج الساحل التجريبي','nesaj-coast-demo','جدة','villa',1650000,21.5433,39.1728],
 ['إيوان النخيل التجريبي','ewan-palms-demo','الرياض','apartment',650000,24.78,46.65],
 ['رتال جاردنز التجريبي','retal-gardens-demo','الدمام','townhouse',1100000,26.44,50.1],
 ['واحة ريزيدنس التجريبي','oasis-residence-demo','جدة','apartment',850000,21.61,39.15],
 ['أفق التجريبي','horizon-demo','الخبر','villa',1900000,26.24,50.2]
];
export async function seed(){
 for(const [i,[name,slug,city,type,priceFrom,latitude,longitude]] of rows.entries()){
  const project=await Project.findOneAndUpdate({slug},{$setOnInsert:{name,slug,city,type,status:['ready','under_construction','upcoming'][i%3],priceFrom,totalUnits:6,image:`https://placehold.co/1200x800?text=Demo+Project+${i+1}`,description:'مشروع وهمي للتطوير والاختبار فقط، غير تابع لشركة رتال. الأسعار والمواقع والمواصفات تجريبية.',location:{address:`حي تجريبي، ${city}`,latitude,longitude},features:['مساحات خضراء','مواقف سيارات','منطقة ألعاب','أمن']}},{upsert:true,new:true,runValidators:true});
  for(let n=1;n<=6;n++) await Unit.updateOne({projectId:project._id,unitNumber:`${i+1}-${n}`},{$setOnInsert:{projectId:project._id,unitNumber:`${i+1}-${n}`,type,area:type==='apartment'?120+n*5:240+n*10,price:priceFrom+(n-1)*25000,bedrooms:type==='apartment'?3:5,bathrooms:type==='apartment'?2:4,status:n===6?'sold':n===5?'reserved':'available'}},{upsert:true,runValidators:true});
 }
}
if(process.argv[1]?.endsWith('/seed.js')){
 try{await mongoose.connect(env.MONGODB_URI,{serverSelectionTimeoutMS:10000});await seed();console.log('Seed complete: 8 demo projects and 48 units. Existing records preserved.');}
 catch{console.error('Seed failed; check database connection.');process.exitCode=1;}
 finally{await mongoose.disconnect();}
}
