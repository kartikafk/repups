import { C, useBreakpoint } from "../theme";
import { INVOICES, PAYOUT_METHOD } from "../mockData";
import { Card, SectionLabel, StatusBadge } from "../components";

// ─── VIEW: BILLING ────────────────────────────────────────────────────────────
export default function BillingView() {
  const { isMobile } = useBreakpoint();
  const totalPaid = INVOICES.filter(i=>i.status==="paid").reduce((s,i)=>s+i.amount,0);
  const totalPending = INVOICES.filter(i=>i.status!=="paid").reduce((s,i)=>s+i.amount,0);

  return (
    <div>
      <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text, marginBottom:22 }}>Billing</h2>

      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:14, marginBottom:18 }}>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.sub, marginBottom:8 }}>Next Payout</div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:800, color:C.lime }}>₹{PAYOUT_METHOD.amount.toLocaleString()}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{PAYOUT_METHOD.nextPayout} · {PAYOUT_METHOD.bank} {PAYOUT_METHOD.account}</div>
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.sub, marginBottom:8 }}>Total Paid</div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:800, color:C.text }}>₹{totalPaid.toLocaleString()}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Across {INVOICES.filter(i=>i.status==="paid").length} invoices</div>
        </Card>
        <Card style={{ padding:20 }}>
          <div style={{ fontSize:11, color:C.sub, marginBottom:8 }}>Outstanding</div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:800, color:C.gold }}>₹{totalPending.toLocaleString()}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Pending or overdue</div>
        </Card>
      </div>

      <Card style={{ padding:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <SectionLabel>Invoices</SectionLabel>
          <button style={{ padding:"8px 14px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, color:C.sub, fontFamily:"inherit", fontSize:12, cursor:"pointer" }}>Export CSV</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {INVOICES.map(inv => (
            <div key={inv.id} style={{ display:"flex", flexWrap: isMobile ? "wrap" : "nowrap", alignItems:"center", gap:14, padding:"12px 14px", background:C.card2, borderRadius:10, border:`1px solid ${C.border2}` }}>
              {!isMobile && <div style={{ fontFamily:"monospace", fontSize:12, color:C.muted, width:80, flexShrink:0 }}>{inv.id}</div>}
              <div style={{ flex:1, minWidth: isMobile ? "100%" : 0 }}>
                <div style={{ fontSize:13, color:C.text, fontWeight:600 }}>{inv.client}</div>
                <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>{inv.service} · {inv.date}</div>
              </div>
              <StatusBadge status={inv.status==="paid"?"completed":inv.status==="overdue"?"cancelled":"pending"} />
              <div style={{ fontFamily:"monospace", fontSize:14, fontWeight:700, color:C.text, width:80, textAlign:"right" }}>₹{inv.amount.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
