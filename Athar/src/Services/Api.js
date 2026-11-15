import axios from 'axios';
export const API = axios.create({baseURL:(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, ''),timeout:15000});
export const types={villa:'فلل',apartment:'شقق',townhouse:'تاون هاوس',mixed:'متعدد الاستخدامات'};
export const statuses={upcoming:'قريباً',under_construction:'تحت الإنشاء',ready:'جاهز',sold_out:'مباع بالكامل'};
export const money=value=>new Intl.NumberFormat('ar-SA').format(value)+' ر.س';
export function errorMessage(error){
 if(error.response?.data?.errors) return error.response.data.errors.map(x=>`${x.field}: ${x.message}`).join('، ');
 const status=error.response?.status;
 return ({401:'مفتاح الإدارة غير صحيح.',404:'المشروع غير موجود.',409:'الرابط مستخدم بالفعل أو المشروع مرتبط بسجلات.',429:'طلبات كثيرة، حاول لاحقاً.'})[status] || (status?'تعذر تنفيذ الطلب. راجع البيانات وحاول مجدداً.':'تعذر الاتصال بالخادم. تأكد من تشغيل الباك إند ثم حاول مجدداً.');
}
export const fetchProperties=async(params={},signal)=>(await API.get('/projects',{params,signal})).data;
export const fetchProject=async(slug,signal)=>(await API.get(`/projects/${encodeURIComponent(slug)}`,{signal})).data.data;
export const fetchUnits=async(id,page=1,signal)=>(await API.get(`/projects/${id}/units`,{params:{page,limit:6},signal})).data;
export const sendInquiry=async(body)=>(await API.post('/inquiries',body)).data;
export const createProject=async(body,key)=>(await API.post('/projects',body,{headers:{Authorization:`Bearer ${key}`}})).data.data;

export const mediaUrl=path=>path?.startsWith('/uploads/')?`${API.defaults.baseURL.replace(/\/api$/,'').replace(/\/$/,'')}${path}`:path;
export const uploadImages=async(files,key)=>{const data=new FormData();for(const file of files)data.append('images',file);return (await API.post('/uploads',data,{headers:{Authorization:`Bearer ${key}`}})).data.data;};
