import {useEffect,useState} from 'react';
import {fetchProject,fetchUnits,sendInquiry,errorMessage,mediaUrl,types,statuses,money} from '../Services/Api';
export default function PropertyModal({property,onClose}){
 const [photo,setPhoto]=useState(null);
 const [project,setProject]=useState(null),[units,setUnits]=useState([]),[page,setPage]=useState(1),[pages,setPages]=useState(0);
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const [sending,setSending]=useState(false),[sent,setSent]=useState(false),[submitError,setSubmitError]=useState('');
 useEffect(()=>{
  if(!property)return;
  const controller=new AbortController();
  async function load(){setLoading(true);setError('');try{
   const detail=await fetchProject(property.slug,controller.signal);
   const result=await fetchUnits(detail._id,page,controller.signal);
   if(!controller.signal.aborted){setProject(detail);setUnits(result.data);setPages(result.pagination.pages);}
  }catch(e){if(!controller.signal.aborted)setError(errorMessage(e));}finally{if(!controller.signal.aborted)setLoading(false);}}
  load();return()=>controller.abort();
 },[property,page,retry]);
 useEffect(()=>{if(!property)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';const close=e=>{if(e.key==='Escape'&&!sending)onClose();};window.addEventListener('keydown',close);return()=>{document.body.style.overflow=old;window.removeEventListener('keydown',close);};},[property,onClose,sending]);
 if(!property)return null;
 async function submit(e){e.preventDefault();if(sending)return;const values=Object.fromEntries(new FormData(e.currentTarget));if(!values.email)delete values.email;setSending(true);setSubmitError('');try{await sendInquiry({...values,projectId:project._id});setSent(true);}catch(err){setSubmitError(errorMessage(err));}finally{setSending(false);}}
 return <div className="overlay" dir="rtl"><section role="dialog" aria-modal="true" aria-label="تفاصيل المشروع" className="dialog">
 <button className="action float-left" aria-label="إغلاق" disabled={sending} onClick={onClose}>✕</button>
 {loading?<p role="status">جاري تحميل التفاصيل…</p>:error?<div role="alert">{error}<button className="action" onClick={()=>setRetry(v=>v+1)}>إعادة المحاولة</button></div>:project&&<>
 <img src={mediaUrl(photo||project.image)} alt={project.name} className="w-full h-64 object-cover rounded-xl"/>
 {project.gallery?.length>1&&<div className="gallery-strip">{project.gallery.map((url,i)=><button key={url} aria-label={`صورة المشروع ${i+1}`} onClick={()=>setPhoto(url)}><img src={mediaUrl(url)} alt={`صورة ${i+1}`}/></button>)}</div>}
 <h2 className="text-2xl font-bold my-4">{project.name}</h2><p>{project.location.address} · {types[project.type]} · {statuses[project.status]}</p>
 <p className="my-4">{project.description}</p><p>يبدأ من {money(project.priceFrom)} · إجمالي الوحدات: {project.totalUnits}</p>
 <ul className="flex flex-wrap gap-3 my-4">{project.features.map((v,i)=><li key={i} className="bg-slate-100 rounded-lg p-2">{v}</li>)}</ul>
 <h3 className="text-xl font-bold my-4">وحدات المشروع</h3>
 {!units.length?<p>لم تُضف وحدات لهذا المشروع بعد.</p>:<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{['الوحدة','النوع','المساحة','السعر','غرف / حمامات','الحالة'].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{units.map(u=><tr key={u._id}><td>{u.unitNumber}</td><td>{types[u.type]}</td><td>{u.area} م²</td><td>{money(u.price)}</td><td>{u.bedrooms} / {u.bathrooms}</td><td>{{available:'متاحة',reserved:'محجوزة',sold:'مباعة'}[u.status]}</td></tr>)}</tbody></table></div>}
 {pages>1&&<div className="flex gap-4 my-4"><button disabled={page<=1} onClick={()=>setPage(v=>v-1)}>السابق</button><span>{page}/{pages}</span><button disabled={page>=pages} onClick={()=>setPage(v=>v+1)}>التالي</button></div>}
 <h3 className="text-xl font-bold mt-8 mb-4">طلب استفسار عن المشروع</h3>
 {sent?<p role="status" className="text-emerald-700">تم إرسال استفسارك بنجاح، وسيتواصل معك الفريق.</p>:<form onSubmit={submit} className="grid gap-3">
 <label>الاسم<input name="name" className="field" maxLength={120} required autoComplete="name"/></label>
 <label>رقم الجوال<input name="phone" className="field" type="tel" minLength={7} maxLength={20} required autoComplete="tel"/></label>
 <label>البريد الإلكتروني (اختياري)<input name="email" type="email" className="field" autoComplete="email"/></label>
 <label>رسالتك<textarea name="message" className="field" maxLength={3000} required/></label>
 {submitError&&<p role="alert">{submitError}</p>}<button className="action" disabled={sending}>{sending?'جاري الإرسال…':'إرسال الاستفسار'}</button></form>}
 </>}
 </section></div>;
}
