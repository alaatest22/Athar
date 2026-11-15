// @vitest-environment jsdom
import {test,expect,afterEach} from 'vitest';
import {render,screen,waitFor,cleanup,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {API} from './Services/Api';
afterEach(cleanup);
const project={_id:'aaaaaaaaaaaaaaaaaaaaaaaa',name:'مشروع الاختبار',slug:'test',city:'جدة',type:'villa',status:'ready',priceFrom:1500000,totalUnits:1,image:'https://example.com/image.jpg',description:'وصف المشروع',location:{address:'جدة',latitude:21,longitude:39},features:['حدائق']};
test('Loads API projects, filters, details and units, submits inquiry and authenticated creation',async()=>{
 const calls=[];API.defaults.adapter=async config=>{calls.push(config);let data;
 if(config.url==='/projects'&&config.method==='get')data={data:[project],pagination:{page:1,pages:1,total:1}};
 else if(config.url==='/projects/test')data={data:project};
 else if(config.url.endsWith('/units'))data={data:[{_id:'u1',unitNumber:'A1',type:'villa',area:250,price:1500000,bedrooms:4,bathrooms:3,status:'available'}],pagination:{pages:1}};
 else if(config.url==='/inquiries')data={success:true};
 else if(config.url==='/projects'&&config.method==='post')data={data:project};
 else throw Error('Unexpected route '+config.url);
 return {data,status:200,statusText:'OK',headers:{},config};};
 const user=userEvent.setup();render(<App/>);
 await screen.findByRole('heading',{name:project.name});
 await user.type(screen.getByLabelText('بحث بالاسم'),'نساج');
 await waitFor(()=>expect(calls.some(c=>c.params?.name==='نساج')).toBe(true));
 await user.click(screen.getByRole('button',{name:'فلل',exact:true}));
 await waitFor(()=>expect(calls.some(c=>c.params?.type==='villa')).toBe(true));
 await user.click(screen.getByRole('button',{name:/عرض التفاصيل/}));await screen.findByText('A1');
 await user.type(screen.getByLabelText('الاسم',{exact:true}),'مصطفى');await user.type(screen.getByLabelText('رقم الجوال'),'+966500000000');await user.type(screen.getByLabelText('رسالتك'),'أرغب في التفاصيل');await user.click(screen.getByRole('button',{name:'إرسال الاستفسار'}));
 await screen.findByText('تم إرسال استفسارك بنجاح، وسيتواصل معك الفريق.');
 const inquiry=JSON.parse(calls.find(c=>c.url==='/inquiries').data);expect(inquiry.projectId).toBe(project._id);expect(inquiry.email).toBeUndefined();
 await user.click(screen.getByRole('button',{name:'إغلاق',exact:true}));await user.click(screen.getByRole('button',{name:'+ رفع مشروع جديد',exact:true}));
 const dialog=within(screen.getByRole('dialog'));for(const [label,value] of [['مفتاح الإدارة','test-private-key'],['اسم المشروع','مشروع جديد'],['الرابط المختصر بالإنجليزية','new-project'],['المدينة','جدة'],['السعر يبدأ من (ر.س)','1000000'],['إجمالي الوحدات','20'],['رابط الصورة','https://example.com/test.jpg'],['العنوان','جدة'],['خط العرض','21'],['خط الطول','39'],['الوصف','وصف جديد']])await user.type(dialog.getByLabelText(label,{exact:true}),value);
 await user.click(screen.getByRole('button',{name:'حفظ المشروع'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 const creation=calls.find(c=>c.url==='/projects'&&c.method==='post');expect(creation.headers.Authorization).toBe('Bearer test-private-key');const body=JSON.parse(creation.data);expect(body.priceFrom).toBe(1000000);expect(body.location.latitude).toBe(21);expect(body.adminKey).toBeUndefined();expect(localStorage.length).toBe(0);
},15000);
test('Network errors are visible and retry recovers without mock fallback',async()=>{
 let fail=true;API.defaults.adapter=async config=>{if(fail)throw Error('Network');return {data:{data:[],pagination:{page:1,pages:0,total:0}},status:200,headers:{},config};};
 render(<App/>);await screen.findByRole('alert');expect(screen.queryByText(project.name)).toBeNull();fail=false;await userEvent.click(screen.getByRole('button',{name:'إعادة المحاولة'}));await screen.findByText('لا توجد مشاريع تطابق البحث.');
});

test('Project gallery uploads files before saving and uses returned cover URL',async()=>{
 const {default:AddProjectModal}=await import('./components/AddProjectModal');let saved=null;let count=0;
 API.defaults.adapter=async config=>{
  if(config.url==='/uploads'){expect(config.headers.Authorization).toBe('Bearer upload-key');expect(config.data.getAll('images')).toHaveLength(1);count++;return {data:{data:['/uploads/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp']},status:201,headers:{},config};}
  if(config.url==='/projects'){saved=JSON.parse(config.data);return {data:{data:project},status:201,headers:{},config};}throw Error('Unexpected route');};
 const user=userEvent.setup();render(<AddProjectModal isOpen onClose={()=>{}} onAddProject={()=>{}}/>);
 for(const [label,value] of [['مفتاح الإدارة','upload-key'],['اسم المشروع','معرض جديد'],['الرابط المختصر بالإنجليزية','gallery-test'],['المدينة','جدة'],['السعر يبدأ من (ر.س)','0'],['إجمالي الوحدات','0'],['العنوان','جدة'],['خط العرض','21'],['خط الطول','39'],['الوصف','تفاصيل المشروع']])await user.type(screen.getByLabelText(label,{exact:true}),value);
 await user.upload(screen.getByLabelText(/صور المشروع من جهازك/),new File(['test-image'],'villa.jpg',{type:'image/jpeg'}));
 await user.click(screen.getByRole('button',{name:'حفظ المشروع'}));await waitFor(()=>expect(saved?.image).toBe('/uploads/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp'));expect(saved.gallery).toHaveLength(1);expect(count).toBe(1);expect(saved.images).toBeUndefined();
});
