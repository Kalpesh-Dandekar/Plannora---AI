import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
export default function DashboardPlaceholder(){return <main className="dashboard-placeholder"><Link href="/"><Logo/></Link><div><span><Sparkles/> NEXT PHASE</span><h1>Your Plannora dashboard is coming next.</h1><p>Your setup flow is complete. The real dashboard experience will be designed in the next UI phase.</p><Link href="/planner"><ArrowLeft/> Return to planner</Link></div></main>}
