import {useState} from 'react';
export default function Navbar({onOpenAddModal}){
 const [open,setOpen]=useState(false);
 return <header className="site-header"><a className="brand" href="#home" aria-label="أثر الرئيسية"><strong>أثر</strong><span>ATHAR</span></a>
 <button className="menu-toggle" aria-label="القائمة" aria-expanded={open} onClick={()=>setOpen(!open)}>☰</button>
 <nav className={open?'nav-links open':'nav-links'} aria-label="القائمة الرئيسية">{[['#home','الرئيسية'],['#projects','مشاريعنا'],['#about','عن أثر'],['#approach','رؤيتنا'],['#contact','تواصل معنا']].map(([href,label])=><a key={href} href={href} onClick={()=>setOpen(false)}>{label}</a>)}</nav>
 <button className="admin-link" onClick={onOpenAddModal}>+ رفع مشروع جديد</button></header>;
}
