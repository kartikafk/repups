import { useEffect, useState } from "react";
import AIOnboardingChat from "./AIOnboardingChat";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";
export default function AICoachPage() { const [insight,setInsight]=useState("");useEffect(()=>{fetch(apiUrl("ai-coach/insights"),{headers:authHeaders()}).then(r=>r.ok?r.json():null).then(data=>setInsight(data?.message||"")).catch(()=>{})},[]);return <AIOnboardingChat coachInsight={insight} />; }
