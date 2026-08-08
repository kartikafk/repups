/* Mock data */
export const TRAINER = {
  name: "Vikram Nair",
  title: "Elite Strength & Corrective Exercise Coach",
  location: "Mumbai, India",
  avatar: "VN",
  rating: 4.9,
  reviews: 127,
  clients: 24,
  experience: 8,
  verified: true,
  earnings: { month: 84000, pending: 12000 },
  response: "< 1 hr",
};

export const CLIENTS = [
  { id:1, avatar:"AM", name:"Arjun Mehta",   goal:"Muscle Gain",  level:"Intermediate", progress:82, streak:14, lastActive:"2h ago",  nextSession:"Today, 5 PM",  status:"active",  issues:[] },
  { id:2, avatar:"PS", name:"Priya Sharma",  goal:"Fat Loss",     level:"Beginner",     progress:54, streak:7,  lastActive:"5h ago",  nextSession:"Tomorrow, 7 AM",status:"active",  issues:["Knee"] },
  { id:3, avatar:"RD", name:"Rohan Das",     goal:"Powerlifting", level:"Advanced",     progress:91, streak:31, lastActive:"1d ago",  nextSession:"Thu, 6 PM",    status:"active",  issues:[] },
  { id:4, avatar:"NK", name:"Neha Kapoor",   goal:"Flexibility",  level:"Beginner",     progress:43, streak:3,  lastActive:"3d ago",  nextSession:"Fri, 8 AM",    status:"inactive",issues:["Lower back"] },
  { id:5, avatar:"SR", name:"Siddharth Roy", avatar:"SR", goal:"Weight Loss",  level:"Intermediate", progress:68, streak:21, lastActive:"1h ago",  nextSession:"Today, 7 PM",  status:"active",  issues:[] },
];

export const APPOINTMENTS = [
  { id:1, client:"Arjun Mehta",   avatar:"AM", type:"Personal Training", date:"Today",    time:"5:00 PM",  duration:"60 min", status:"confirmed", price:2500 },
  { id:2, client:"Siddharth Roy", avatar:"SR", type:"Video Consultation", date:"Today",    time:"7:00 PM",  duration:"45 min", status:"confirmed", price:1500 },
  { id:3, client:"Priya Sharma",  avatar:"PS", type:"Personal Training", date:"Tomorrow", time:"7:00 AM",  duration:"60 min", status:"pending",   price:2500 },
  { id:4, client:"Rohan Das",     avatar:"RD", type:"Workout Programming",date:"Thu",      time:"6:00 PM",  duration:"30 min", status:"confirmed", price:1000 },
  { id:5, client:"Neha Kapoor",   avatar:"NK", type:"Personal Training", date:"Fri",      time:"8:00 AM",  duration:"60 min", status:"requested", price:2500 },
];

export const MESSAGES = [
  { id:1, avatar:"AM", name:"Arjun Mehta",   preview:"Coach, should I increase the weight on deadlifts this week?",  time:"10 min ago", unread:2 },
  { id:2, avatar:"PS", name:"Priya Sharma",  preview:"Completed today's session! Felt really good.",                   time:"1 hr ago",  unread:0 },
  { id:3, avatar:"RD", name:"Rohan Das",     preview:"Attached my latest squat assessment. Can you review?",           time:"3 hr ago",  unread:1 },
  { id:4, avatar:"NK", name:"Neha Kapoor",   preview:"I had to skip Tuesday, can we reschedule to Thursday?",          time:"Yesterday", unread:0 },
  { id:5, avatar:"SR", name:"Siddharth Roy", preview:"The new meal plan is working great! Down 2kg this week.",        time:"Yesterday", unread:0 },
];

export const QNA = [
  { id:1, client:"Ananya Singh",  avatar:"AS", question:"Why does my knee cave in during squats even when I try to fix it?",    tags:["Biomechanics","Squat","Knee"],    time:"2h ago",  aiAnswered:false, replies:0 },
  { id:2, client:"Dev Patel",     avatar:"DP", question:"How do I fix my rounded upper back during deadlifts?",                 tags:["Posture","Deadlift","Back"],       time:"4h ago",  aiAnswered:false, replies:0 },
  { id:3, client:"Meera Joshi",   avatar:"MJ", question:"I feel my right side working more than my left during pull-ups. Why?", tags:["Imbalance","Pull-ups","Shoulder"], time:"Yesterday", aiAnswered:false, replies:0 },
  { id:4, client:"Rahul Verma",   avatar:"RV", question:"What's the best approach for building strength as a beginner?",        tags:["Beginner","Strength","Programming"],time:"2d ago", aiAnswered:false, replies:0 },
];

export const PLANS = [
  { id:1, name:"Hypertrophy Block A",   client:"Arjun Mehta",   days:5, weeks:8, lastUpdated:"Today",     status:"active" },
  { id:2, name:"Fat Loss HIIT Program", client:"Priya Sharma",  days:4, weeks:12,lastUpdated:"Yesterday", status:"active" },
  { id:3, name:"Powerlifting Peak",     client:"Rohan Das",     days:6, weeks:16,lastUpdated:"3d ago",    status:"active" },
  { id:4, name:"Mobility & Recovery",   client:"Neha Kapoor",   days:3, weeks:6, lastUpdated:"1w ago",    status:"draft"  },
  { id:5, name:"Weight Loss Phase 2",   client:"Siddharth Roy", days:5, weeks:10,lastUpdated:"2d ago",    status:"active" },
];

export const ASSESSMENTS = [
  { id:1, client:"Arjun Mehta",   avatar:"AM", type:"Squat Analysis",     score:84, issues:["Slight forward lean"],           date:"Today",     shared:true  },
  { id:2, client:"Priya Sharma",  avatar:"PS", type:"Posture Assessment",  score:71, issues:["Anterior pelvic tilt","Knee valgus"], date:"Yesterday", shared:true  },
  { id:3, client:"Rohan Das",     avatar:"RD", type:"Deadlift Analysis",   score:92, issues:[],                                date:"3d ago",    shared:true  },
  { id:4, client:"Siddharth Roy", avatar:"SR", type:"Movement Screening",  score:67, issues:["Hip flexor tightness"],          date:"1w ago",    shared:false },
];

export const REVIEWS = [
  { id:1, client:"Arjun Mehta",   avatar:"AM", overall:5, knowledge:5, communication:5, professionalism:5, value:5, text:"Vikram completely transformed my training...", date:"Jul 28" },
  { id:2, client:"Priya Sharma",  avatar:"PS", overall:5, knowledge:5, communication:4, professionalism:5, value:4, text:"Lost 8kg in 3 months...", date:"Jul 27" },
  { id:3, client:"Rohan Das",     avatar:"RD", overall:5, knowledge:5, communication:5, professionalism:5, value:5, text:"Best investment I've made...", date:"Jul 22" },
];

export const EARNINGS_DATA = [
  { month:"Feb", amount:58000 },
  { month:"Mar", amount:66000 },
  { month:"Apr", amount:71000 },
  { month:"May", amount:79000 },
  { month:"Jun", amount:75000 },
  { month:"Jul", amount:84000 },
];

export const NOTIFICATIONS = [
  { id:1, type:"booking",  icon:"📅", title:"New session request", body:"Neha Kapoor requested a session for Fri, 8 AM", time:"12 min ago", unread:true  },
  { id:2, type:"message",  icon:"💬", title:"New message", body:"Arjun Mehta sent you a message about deadlift progression", time:"45 min ago", unread:true  },
  { id:3, type:"payment",  icon:"₹", title:"Payment received", body:"₹2,500 received from Siddharth Roy for Personal Training", time:"2 hr ago",  unread:true  },
  { id:4, type:"review",   icon:"⭐", title:"New review", body:"Priya Sharma left you a 5★ review", time:"5 hr ago",  unread:false },
  { id:5, type:"assessment",icon:"🧍", title:"Assessment shared", body:"Rohan Das shared a new Deadlift Analysis", time:"1 day ago", unread:false },
  { id:6, type:"system",   icon:"🔔", title:"Certificate expiring soon", body:"Your Precision Nutrition Level 1 verification is pending review", time:"2 days ago", unread:false },
];

export const INVOICES = [
  { id:"INV-1042", client:"Arjun Mehta",   service:"Personal Training",   amount:2500, status:"paid",    date:"Jul 28, 2026" },
  { id:"INV-1041", client:"Siddharth Roy", service:"Video Consultation",  amount:1500, status:"paid",    date:"Jul 27, 2026" },
  { id:"INV-1040", client:"Priya Sharma",  service:"Personal Training",   amount:2500, status:"pending", date:"Jul 25, 2026" },
  { id:"INV-1039", client:"Rohan Das",     service:"Workout Programming", amount:1000, status:"paid",    date:"Jul 22, 2026" },
  { id:"INV-1038", client:"Neha Kapoor",   service:"Personal Training",   amount:2500, status:"overdue", date:"Jul 15, 2026" },
];

export const PAYOUT_METHOD = { bank:"HDFC Bank", account:"•••• 4821", nextPayout:"Aug 7, 2026", amount:12000 };

export const TRAINER_PROGRESS = { loginStreak: 12, sessionsDelivered: 214, clientsCoached: 24, fiveStarReviews: 98 };

export const TRAINER_BADGE_DEFS = [
  { id:"streak7",   label:"7 Day Streak",       icon:"🔥", type:"streak",   threshold:7   },
  { id:"streak14",  label:"14 Day Streak",      icon:"⚡", type:"streak",   threshold:14  },
  { id:"streak30",  label:"30 Day Streak",      icon:"🏅", type:"streak",   threshold:30  },
  { id:"sessions100",label:"100 Sessions",      icon:"💪", type:"sessions", threshold:100 },
  { id:"sessions250",label:"250 Sessions",      icon:"🏆", type:"sessions", threshold:250 },
  { id:"clients25", label:"25 Clients Coached", icon:"👥", type:"clients",  threshold:25  },
];

export const HELP_TOPICS = [
  { id:1, q:"How do I get paid?",               a:"Payouts are sent weekly to your linked bank account, minus platform fees. You can track pending vs. paid amounts in the Earnings and Billing pages." },
  { id:2, q:"How do I change my availability?",  a:"Go to My Profile → Availability and toggle the days and hours you're open for bookings. Clients only see open slots in real time." },
  { id:3, q:"What happens if a client cancels?", a:"Cancellations made more than 24 hours before a session are free. Late cancellations may be eligible for a partial charge depending on your cancellation policy." },
  { id:4, q:"How are Q&A questions matched to me?", a:"Questions are matched based on your specializations and certifications. You can decline a question if it's outside your scope." },
  { id:5, q:"How do I upload a new certification?", a:"Go to My Profile → Certifications → Upload New Certificate. Our team verifies new certificates within 2–3 business days." },
];

export const NAV_ITEMS = [
  { id:"dashboard",    icon:"◈",  label:"Dashboard"     },
  { id:"appointments", icon:"📅", label:"Appointments"  },
  { id:"calendar",     icon:"🗓️", label:"Calendar"      },
  { id:"reviews",      icon:"⭐", label:"Reviews"       },
  { id:"earnings",     icon:"₹",  label:"Earnings"      },
  { id:"billing",      icon:"🧾", label:"Billing"       },
  { id:"profile",      icon:"🪪", label:"My Profile"    },
  { id:"settings",     icon:"⚙️", label:"Settings"      },
  { id:"help",         icon:"🛟", label:"Help & Support"},
];
