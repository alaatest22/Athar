import {useState} from 'react';
import {createProject,uploadImages,errorMessage,types,statuses} from '../Services/Api';
export default function AddProjectModal({isOpen,onClose,onAddProject}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!isOpen)return null;
 async function submit(e){e.preventDefault();if(busy)return;const f=Object.fromEntries(new FormData(e.currentTarget));const key=f.adminKey;delete f.adminKey;const files=e.currentTarget.elements.images.files;delete f.images;
 const body={...f,priceFrom:Number(f.priceFrom),totalUnits:Number(f.totalUnits),features:f.features.split(',').map(x=>x.trim()).filter(Boolean),location:{address:f.address,latitude:Number(f.latitude),longitude:Number(f.longitude)}};
 delete body.address;delete body.latitude;delete body.longitude;
 setBusy(true);setError('');try{if(files.length){if(files.length>10||[...files].some(file=>file.size>8*1024*1024)){setError('الحد الأقصى 10 صور، وحجم الصورة 8 ميجابايت.');setBusy(false);return;}const uploaded=await uploadImages(files,key);body.image=uploaded[0];body.gallery=uploaded;}if(!body.image){setError('اختر صورة من جهازك أو أدخل رابط صورة.');setBusy(false);return;}const project=await createProject(body,key);onAddProject(project);onClose();}catch(err){setError(errorMessage(err));}finally{setBusy(false);}}
 return <div className="overlay" dir="rtl"><section role="dialog" aria-modal="true" aria-label="إضافة مشروع" className="dialog">
 <button className="action float-left" disabled={busy} onClick={onClose}>إغلاق</button><h2 className="text-2xl font-bold mb-6">إضافة مشروع — للإدارة</h2>
 <form onSubmit={submit} className="grid gap-4">
 <label>مفتاح الإدارة<input className="field" name="adminKey" type="password" required autoComplete="off"/></label>
 <p className="text-sm text-slate-500">أدخل المفتاح الخاص بك لهذه العملية فقط. لا يتم تخزينه في المتصفح.</p>
 {[['name','اسم المشروع','text'],['slug','الرابط المختصر بالإنجليزية','text'],['city','المدينة','text'],['priceFrom','السعر يبدأ من (ر.س)','number'],['totalUnits','إجمالي الوحدات','number'],['image','رابط الصورة','url'],['address','العنوان','text'],['latitude','خط العرض','number'],['longitude','خط الطول','number']].map(([name,label,type])=><label key={name}>{label}<input className="field" name={name} type={type} required={name!=='image'} step={name==='totalUnits'?'1':'any'} min={['priceFrom','totalUnits'].includes(name)?0:name==='latitude'?-90:name==='longitude'?-180:undefined} max={name==='latitude'?90:name==='longitude'?180:undefined} pattern={name==='slug'?'[a-z0-9]+(-[a-z0-9]+)*':undefined}/></label>)}
 <label className="upload-zone">صور المشروع من جهازك<input className="field" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple/><small>حتى 10 صور، 8 ميجابايت للصورة. أول صورة هي الغلاف. رفع الصور اختياري عند إدخال رابط.</small></label>
 <label>نوع المشروع<select className="field" name="type">{Object.entries(types).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 <label>الحالة<select className="field" name="status">{Object.entries(statuses).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
 <label>الوصف<textarea className="field" name="description" required maxLength={10000}/></label>
 <label>المميزات (افصل بفاصلة إنجليزية)<input className="field" name="features"/></label>
 {error&&<p role="alert">{error}</p>}<button className="action" disabled={busy}>{busy?'جاري الحفظ…':'حفظ المشروع'}</button>
 </form></section></div>;
}
