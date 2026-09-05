import {ArrowRight,Sparkles} from "lucide-react";
export function PageHeader({eyebrow,title,copy,action}:{eyebrow?:string;title:string;copy:string;action?:React.ReactNode}){return <header className="app-page-head"><div>{eyebrow&&<span>{eyebrow}</span>}<h1>{title}</h1><p>{copy}</p></div>{action}</header>}
export function ProgressBar({value}:{value:number}){return <div className="ui-progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${value}%`}}/></div>}
export function Stat({label,value,note}:{label:string;value:string;note?:string}){return <article className="ui-stat"><span>{label}</span><b>{value}</b>{note&&<small>{note}</small>}</article>}
export function Insight({title,children}:{title:string;children:React.ReactNode}){return <aside className="ui-insight"><Sparkles/><div><b>{title}</b><p>{children}</p></div><ArrowRight/></aside>}
export function AppButton({children,onClick,quiet=false}:{children:React.ReactNode;onClick?:()=>void;quiet?:boolean}){return <button className={`app-button${quiet?" quiet":""}`} onClick={onClick}>{children}</button>}
