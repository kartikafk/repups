import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { authHeaders } from "../../api.js";
import { 
  EXERCISE_LIBRARY, 
  searchExerciseLibrary, 
  getExercisesFor, 
  getCameraHint 
} from "../../hooks/exercises";

const C = {
  bg: "#0a0a0a", surface: "#111111", card: "#161616", border: "#222222",
  lime: "#C8F135", red: "#FF4444", blue: "#3B82F6",
  muted: "#555555", text: "#EEEEEE", sub: "#888888",
};

const WEIGHTED_SECTIONS = [
  { id: 'upper', label: 'Upper Body', muscleGroups: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Core'] },
  { id: 'lower', label: 'Lower Body', muscleGroups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] }
];

const BODYWEIGHT_SECTIONS = [
  { id: 'push', label: 'Push', muscleGroups: ['Push'] },
  { id: 'pull', label: 'Pull', muscleGroups: ['Pull'] },
  { id: 'legs', label: 'Legs', muscleGroups: ['Legs'] },
  { id: 'core', label: 'Core', muscleGroups: ['Core'] }
];

function RestTimer({ seconds, onDone }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    setRemaining(seconds);
    const t = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(t); onDone?.(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [seconds]);
  const pct = (remaining / seconds) * 100;
  return (
    <div style={{ background:`linear-gradient(135deg,${C.lime}18,${C.lime}05)`, border:`1px solid ${C.lime}44`, borderRadius:16, padding:20, textAlign:"center" }}>
      <div style={{ fontSize:11, color:C.sub, textTransform:"uppercase", letterSpacing:2, marginBottom:8 }}>Rest</div>
      <div style={{ fontSize:42, fontWeight:900, color:C.lime, fontFamily:"'Barlow Condensed',sans-serif" }}>
        {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,"0")}
      </div>
      <div style={{ background:C.border, borderRadius:99, height:6, overflow:"hidden", marginTop:12 }}>
        <div style={{ width:`${pct}%`, height:"100%", background:C.lime, borderRadius:99, transition:"width 1s linear" }} />
      </div>
      <button onClick={onDone} style={{ marginTop:14, background:"transparent", border:`1px solid ${C.border}`, color:C.sub, borderRadius:8, padding:"6px 16px", fontSize:12, cursor:"pointer" }}>Skip Rest</button>
    </div>
  );
}

function getLocalDateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 🔑 Bulletproof user ID resolver to strictly isolate accounts
function getResolvedUserId(propUserId) {
  if (propUserId && propUserId !== 'undefined' && propUserId !== 'null' && propUserId !== 'guest') {
    return propUserId;
  }

  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?._id) return String(parsed._id);
      if (parsed?.id) return String(parsed.id);
    }
  } catch (e) {}

  return (
    localStorage.getItem('profileId') || 
    localStorage.getItem('userId') || 
    null
  );
}

export default function WorkoutSessionPlayer({ userId: propUserId }) {
  const navigate = useNavigate();
  
  // 🔑 Extract precise authenticated profile ID strictly for this session
  const userId = getResolvedUserId(propUserId);

  useEffect(() => {
    if (!userId) {
      console.warn("⚠️ No user ID detected in session player. Redirecting to signup.");
      navigate('/');
    }
  }, [userId, navigate]);
  
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [selectedExKey, setSelectedExKey] = useState(EXERCISE_LIBRARY[0]?.key || "benchPress");
  const [search, setSearch] = useState('');
  const [exerciseType, setExerciseType] = useState('weighted'); 
  const [openMainSection, setOpenMainSection] = useState(null);
  const [openMuscleGroup, setOpenMuscleGroup] = useState(null);

  const [facingMode, setFacingMode] = useState('user');
  const [resting, setResting] = useState(false);
  const [rpe, setRpe] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  
  const [activeSets, setActiveSets] = useState([0, 1, 2]); 
  const [activeSetIndex, setActiveSetIndex] = useState(0); 
  
  const [setWeights, setSetWeights] = useState({});
  const [weightError, setWeightError] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);

  const [setAssessments, setSetAssessments] = useState({});

  const todayOnlyStr = getLocalDateString(new Date());
  const dateKeyStr = getLocalDateString(selectedDate);
  
  const isPastDate = dateKeyStr < todayOnlyStr;
  const isFutureDate = dateKeyStr > todayOnlyStr;
  const isReadOnly = isPastDate || isFutureDate;

  const currentExerciseObj = useMemo(() => {
    return EXERCISE_LIBRARY.find(ex => ex.key === selectedExKey || ex.trackingKey === selectedExKey) || EXERCISE_LIBRARY[0];
  }, [selectedExKey]);

  const isBodyweightEx = useMemo(() => {
    const eq = (currentExerciseObj?.equipment || "").toLowerCase();
    const name = (currentExerciseObj?.name || "").toLowerCase();
    
    return (
      (exerciseType === 'bodyweight' && !currentExerciseObj?.muscleGroups?.includes("Core")) ||
      eq.includes("bodyweight") || 
      eq.includes("body weight") || 
      name.includes("bodyweight") || 
      name.includes("push-up") || 
      name.includes("pull-up")
    );
  }, [currentExerciseObj, exerciseType]);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    return searchExerciseLibrary(search);
  }, [search]);

  const activeSections = exerciseType === 'weighted' ? WEIGHTED_SECTIONS : BODYWEIGHT_SECTIONS;

  const preventFocusSteal = (e) => {
    e.preventDefault();
  };

  const isSelected = (ex) => selectedExKey === ex.key || selectedExKey === ex.trackingKey;

  const handlePickExercise = (ex) => {
    if (isReadOnly) return; 
    const keyToSet = ex.trackable ? (ex.trackingKey || ex.key) : ex.key;
    setSelectedExKey(keyToSet);
    setSearch(''); 
  };

  const toggleMainSection = (id) => {
    setOpenMainSection((prev) => {
      const next = prev === id ? null : id;
      setOpenMuscleGroup(null);
      return next;
    });
  };

  const toggleMuscleGroup = (key) => {
    setOpenMuscleGroup((prev) => (prev === key ? null : key));
  };

  // 🔑 Fetch history strictly partitioned by the current user's unique ID
  useEffect(() => {
    if (!userId) return;

    async function fetchSetScores() {
      try {
        const query = new URLSearchParams();
        query.append('userId', userId);
        query.append('exercise', currentExerciseObj.name);
        query.append('date', dateKeyStr);

        console.log("📥 [WorkoutSessionPlayer] Fetching sets for userId:", userId);
const res = await fetch(`/api/sessions?${query.toString()}`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          const map = {};
          const weightMap = {};
          data.forEach(record => {
            if (record.setIndex !== undefined && record.setIndex !== null) {
              map[record.setIndex] = record; 
              if (record.weight !== undefined) {
                weightMap[record.setIndex] = record.weight;
              }
            }
          });
          setSetAssessments(map);
          setSetWeights(weightMap);
          
          const maxIdx = Math.max(...data.map(d => d.setIndex ?? 0), 2);
          if (maxIdx >= activeSets.length) {
            const extended = [];
            for (let i = 0; i <= maxIdx; i++) extended.push(i);
            setActiveSets(extended);
          }
        } else {
          setSetAssessments({});
          setSetWeights({});
        }
      } catch (err) {
        console.error('Failed to load set history:', err);
      }
    }
    fetchSetScores();
  }, [selectedExKey, currentExerciseObj, userId, dateKeyStr]);

  const changeDay = (offset) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + offset);
    if (offset > 0 && getLocalDateString(nextDate) > todayOnlyStr) {
      return;
    }
    setSelectedDate(nextDate);
  };

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const selectSet = (setIdx) => {
    setActiveSetIndex(setIdx);
    setWeightError("");
    
    const setScoreData = setAssessments[setIdx];
    if (setScoreData && setScoreData.avgScore !== undefined) {
      navigate('/report', { state: { report: setScoreData } });
    }
  };

  const addMoreSet = () => {
    if (isReadOnly) return;
    setActiveSets(prev => [...prev, prev.length]);
  };

  const handleWeightChange = (val) => {
    setSetWeights(prev => ({
      ...prev,
      [activeSetIndex]: val
    }));
    if (val) setWeightError("");
  };

  const currentWeightValue = setWeights[activeSetIndex] ?? "";
  const mins = Math.floor(elapsed / 60), secs = elapsed % 60;
  const currentSetAssessment = setAssessments[activeSetIndex];

  return (
<div className="workout-session-page" style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Barlow','Barlow Condensed',sans-serif", paddingBottom: "80px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap" rel="stylesheet"/>
      
      <style>{`
        .ex-list-area::-webkit-scrollbar,
        .acc-section-body::-webkit-scrollbar,
        .acc-muscle-body::-webkit-scrollbar {
          display: none;
        }
        .ex-list-area, .acc-section-body, .acc-muscle-body {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>

<div className="workout-session-content" style={{ maxWidth:460, margin:"0 auto", padding:"28px 20px", display:"flex", flexDirection:"column", gap:16 }}>
        
        {/* Navigation Back Button */}
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              background: C.surface, 
              border: `1px solid ${C.border}`, 
              color: C.lime, 
              borderRadius: 8, 
              padding: "6px 12px", 
              fontSize: 12, 
              fontWeight: 700, 
              cursor: "pointer", 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 6 
            }}
          >
            &lt; Home Screen
          </button>
        </div>

        {/* Header */}
    <div className="workout-session-hero" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div className="workout-session-title" style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, letterSpacing:1 }}>Workout Tracking</div>
            <div style={{ fontSize:11, color:C.sub }}>
              {isReadOnly ? "🔒 Historical Read-Only View" : "Select Target & Log Sets"}
            </div>
          </div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 14px", textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:900, color:C.lime, fontFamily:"'Barlow Condensed',sans-serif" }}>{mins}:{String(secs).padStart(2,"0")}</div>
            <div style={{ fontSize:9, color:C.sub, textTransform:"uppercase" }}>Elapsed</div>
          </div>
        </div>

        {/* ── DATE & WEEK DAY NAVIGATOR ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.lime }}>
              {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => changeDay(-1)} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 12 }}>‹</button>
              <button onClick={() => setSelectedDate(new Date())} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.sub, borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 10 }}>Today</button>
              <button 
                onClick={() => changeDay(1)} 
                disabled={getLocalDateString(new Date(selectedDate.getTime() + 86400000)) > todayOnlyStr}
                style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 12, opacity: getLocalDateString(new Date(selectedDate.getTime() + 86400000)) > todayOnlyStr ? 0.3 : 1 }}
              >
                ›
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
            {weekDays.map((d) => {
              const dStr = getLocalDateString(d);
              const isFuture = dStr > todayOnlyStr;
              const isSelectedDay = d.toDateString() === selectedDate.toDateString();
              const isToday = dStr === todayOnlyStr;
              const dayInitial = d.toLocaleDateString(undefined, { weekday: 'narrow' });
              const dayNum = d.getDate();

              return (
                <button
                  key={d.toISOString()}
                  disabled={isFuture}
                  onClick={() => !isFuture && setSelectedDate(d)}
                  style={{
                    flex: 1,
                    background: isSelectedDay ? C.lime : C.surface,
                    color: isSelectedDay ? "#000" : isFuture ? C.muted : C.text,
                    border: `1.5px solid ${isToday ? C.blue : C.border}`,
                    borderRadius: 8,
                    padding: "6px 2px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: isFuture ? "not-allowed" : "pointer",
                    opacity: isFuture ? 0.3 : 1,
                    outline: isSelectedDay ? `2px solid ${C.text}` : "none"
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{dayInitial}</span>
                  <span style={{ fontSize: 12, fontWeight: 900 }}>{dayNum}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── EXERCISE PICKER ACCORDION ── */}
        {!isReadOnly && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Select Exercise</div>
            
            <div style={{ position: "relative", marginBottom: 12 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.sub }}>⌕</span>
              <input
                type="text"
                placeholder="Search name, muscle, or equipment…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px 10px 32px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
              {search && (
                <button type="button" onMouseDown={preventFocusSteal} onClick={() => setSearch('')} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.sub, cursor: "pointer" }}>
                  ✕
                </button>
              )}
            </div>

            {!searchResults && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <button
                  type="button"
                  onMouseDown={preventFocusSteal}
                  onClick={() => { setExerciseType('weighted'); setOpenMainSection(null); setOpenMuscleGroup(null); }}
                  style={{ flex: 1, padding: "8px", borderRadius: 8, background: exerciseType === 'weighted' ? C.lime : C.surface, color: exerciseType === 'weighted' ? "#000" : C.sub, border: `1px solid ${exerciseType === 'weighted' ? C.lime : C.border}`, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                >
                  🏋️ Weighted
                </button>
                <button
                  type="button"
                  onMouseDown={preventFocusSteal}
                  onClick={() => { setExerciseType('bodyweight'); setOpenMainSection(null); setOpenMuscleGroup(null); }}
                  style={{ flex: 1, padding: "8px", borderRadius: 8, background: exerciseType === 'bodyweight' ? C.lime : C.surface, color: exerciseType === 'bodyweight' ? "#000" : C.sub, border: `1px solid ${exerciseType === 'bodyweight' ? C.lime : C.border}`, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                >
                  🤸 Bodyweight
                </button>
              </div>
            )}

            <div className="ex-list-area" style={{ maxHeight: 200, overflowY: "auto" }}>
              {searchResults ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {searchResults.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.sub, textAlign: "center", padding: 12 }}>No exercises match your search.</div>
                  ) : (
                    searchResults.map(ex => (
                      <button
                        key={ex.key}
                        onClick={() => handlePickExercise(ex)}
                        style={{ background: isSelected(ex) ? C.lime + "22" : C.surface, border: `1px solid ${isSelected(ex) ? C.lime : C.border}`, borderRadius: 8, padding: "10px", textAlign: "left", cursor: "pointer", color: isSelected(ex) ? C.lime : C.text, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13 }}>{ex.name}</div>
                          <div style={{ fontSize: 10, color: C.sub }}>{ex.muscleGroups?.join(", ")} • {ex.equipment}</div>
                        </div>
                        {isSelected(ex) && <span style={{ fontSize: 12 }}>✓</span>}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {activeSections.map((section) => {
                    const isOpen = openMainSection === section.id;
                    const totalCount = section.muscleGroups.reduce((sum, mg) => sum + getExercisesFor(exerciseType, section.id, mg).length, 0);

                    return (
                      <div key={section.id} style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                        <button
                          type="button"
                          onMouseDown={preventFocusSteal}
                          onClick={() => toggleMainSection(section.id)}
                          style={{ width: "100%", background: C.surface, border: "none", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", color: C.text, fontWeight: 800, fontSize: 12, cursor: "pointer" }}
                        >
                          <span>{section.label} ({totalCount})</span>
                          <span style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>⌄</span>
                        </button>

                        {isOpen && (
                          <div style={{ padding: "6px", background: C.bg, display: "flex", flexDirection: "column", gap: 6 }}>
                            {section.muscleGroups.map((mg) => {
                              const muscleKey = `${section.id}:${mg}`;
                              const isMuscleOpen = openMuscleGroup === muscleKey;
                              const exercises = getExercisesFor(exerciseType, section.id, mg);
                              if (exercises.length === 0) return null;

                              return (
                                <div key={mg} style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
                                  <button
                                    type="button"
                                    onMouseDown={preventFocusSteal}
                                    onClick={() => toggleMuscleGroup(muscleKey)}
                                    style={{ width: "100%", background: C.surface, border: "none", padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", color: C.sub, fontWeight: 700, fontSize: 11, cursor: "pointer" }}
                                  >
                                    <span>{mg} ({exercises.length})</span>
                                    <span>{isMuscleOpen ? "▲" : "▼"}</span>
                                  </button>

                                  {isMuscleOpen && (
                                    <div style={{ padding: "6px", display: "grid", gridTemplateColumns: "1fr", gap: 4 }}>
                                      {exercises.map((ex) => {
                                        const selected = isSelected(ex);
                                        return (
                                          <button
                                            key={ex.key}
                                            type="button"
                                            onClick={() => handlePickExercise(ex)}
                                            style={{ background: selected ? C.lime + "22" : C.card, border: `1px solid ${selected ? C.lime : C.border}`, borderRadius: 6, padding: "8px", textAlign: "left", cursor: "pointer", color: selected ? C.lime : C.text, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                          >
                                            <span style={{ fontSize: 12, fontWeight: 700 }}>{ex.name}</span>
                                            <span style={{ fontSize: 10, color: C.sub }}>{ex.equipment}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Camera Hint Display */}
        {currentExerciseObj && currentExerciseObj.trackable && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, fontSize: 11, color: C.sub }}>
            📐 {getCameraHint(currentExerciseObj.trackingKey || currentExerciseObj.key)}
          </div>
        )}

        {resting && !isReadOnly ? (
          <RestTimer seconds={90} onDone={()=>setResting(false)} />
        ) : (
          <>
            {/* Current Exercise Card */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:11, color:C.sub, textTransform:"uppercase", letterSpacing:1 }}>Active Exercise Track</div>
                  <div style={{ fontSize:22, fontWeight:900, color:C.text, fontFamily:"'Barlow Condensed',sans-serif" }}>{currentExerciseObj.name}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:800, color:C.lime }}>{currentExerciseObj.equipment}</div>
                  <div style={{ fontSize:11, color:C.sub }}>Target: {currentExerciseObj.muscleGroups?.join(", ")}</div>
                </div>
              </div>

              {/* Weight Input */}
              {!isBodyweightEx && (
                <div style={{ marginBottom: 16, marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize:11, color: weightError ? C.red : C.sub, textTransform:"uppercase", letterSpacing:1 }}>
                      Weight Hit (kg) — <span style={{ color: C.lime }}>Required for Progression</span>
                    </div>
                  </div>
                  <input 
                    type="number" 
                    value={currentWeightValue} 
                    disabled={isReadOnly}
                    onChange={(e) => handleWeightChange(e.target.value)}
                    placeholder="e.g. 60 (Required)"
                    style={{ 
                      width: "100%", 
                      background: C.surface, 
                      border: `1.5px solid ${weightError ? C.red : C.border}`, 
                      borderRadius: 10, 
                      padding: "12px", 
                      color: C.text, 
                      outline: "none", 
                      fontSize: 14, 
                      boxSizing: "border-box", 
                      opacity: isReadOnly ? 0.6 : 1 
                    }}
                  />
                  {weightError && (
                    <div style={{ fontSize: 11, color: C.red, marginTop: 4, fontWeight: 700 }}>
                      ⚠️ {weightError}
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize:11, color:C.sub, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                {isReadOnly ? "Historical Set Scores" : "Select Set to Focus & Assess"}
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                
                {activeSets.map((si) => {
                  const setScoreData = setAssessments[si];
                  const isFocused = activeSetIndex === si;
                  const hasScore = setScoreData?.avgScore !== undefined;

                  return (
                    <button 
                      key={si} 
                      onClick={()=>selectSet(si)} 
                      style={{
                        flex: 1, minWidth: 75, height: 64, borderRadius: 10, 
                        border: `1.5px solid ${isFocused ? C.blue : hasScore ? C.lime : C.border}`,
                        background: hasScore ? C.lime+"20" : "transparent", 
                        color: hasScore ? C.lime : C.muted,
                        fontSize: 12, fontWeight: 800, cursor: "pointer", 
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: "4px",
                        transition: "all 0.2s"
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{`S${si+1}`}</span>
                      {hasScore ? (
                        <span style={{ fontSize: 11, color: C.lime, fontWeight: 900 }}>{setScoreData.avgScore}%</span>
                      ) : (
                        <span style={{ fontSize: 9, color: C.sub }}>Pending</span>
                      )}
                    </button>
                  );
                })}
                
                {!isReadOnly && (
                  <button onClick={addMoreSet} style={{
                    width: 48, height: 64, borderRadius:10, border:`1.5px dashed ${C.border}`, background: "transparent", color: C.sub, fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    +
                  </button>
                )}
              </div>

              {/* Set Detail View */}
              <div style={{ marginTop: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase" }}>Selected Set Focus</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Set {activeSetIndex + 1} Assessment</div>
                </div>
                {currentSetAssessment ? (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.lime }}>{currentSetAssessment.avgScore}% Form</div>
                    <div style={{ fontSize: 10, color: C.sub }}>{currentSetAssessment.repCount} Reps | {currentSetAssessment.avgRom}° ROM</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: C.sub }}>{isReadOnly ? "No record found" : "Tap camera below to record"}</div>
                )}
              </div>

            </div>

            {/* YOUTUBE VIDEO PREVIEW SECTION */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
                🎥 {currentExerciseObj.name} Video Demo
              </div>
              <div style={{ width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: 10, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed ${C.border}` }}>
                {currentExerciseObj.youtubeId ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${currentExerciseObj.youtubeId}`} 
                    title={`${currentExerciseObj.name} Demo`}
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: 12 }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>▶️</div>
                    <div style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>{currentExerciseObj.name} Demo Placeholder</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Attach YouTube embed ID later in library</div>
                  </div>
                )}
              </div>
            </div>

            {/* RPE input */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18 }}>
              <div style={{ fontSize:11, color:C.sub, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>Rate of Perceived Exertion</div>
              <div style={{ display:"flex", gap:6 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(v => (
                  <button key={v} disabled={isReadOnly} onClick={()=>setRpe(v)} style={{ flex:1, height:36, borderRadius:8, border:`1px solid ${rpe===v?C.lime:C.border}`, background: rpe===v ? C.lime : "transparent", color: rpe===v ? "#000" : C.sub, fontSize:12, fontWeight:700, cursor: isReadOnly ? "default" : "pointer" }}>{v}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Camera View Switcher & Actions */}
        {!isReadOnly && (
          <div style={{ display:"flex", flexDirection: "column", gap:10, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 1 }}>Camera Direction</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => setFacingMode('user')}
                style={{ flex: 1, padding: "8px", borderRadius: 8, background: facingMode === 'user' ? C.blue : C.surface, color: facingMode === 'user' ? "#fff" : C.sub, border: `1px solid ${facingMode === 'user' ? C.blue : C.border}`, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
              >
                Front Camera
              </button>
              <button 
                onClick={() => setFacingMode('environment')}
                style={{ flex: 1, padding: "8px", borderRadius: 8, background: facingMode === 'environment' ? C.blue : C.surface, color: facingMode === 'environment' ? "#fff" : C.sub, border: `1px solid ${facingMode === 'environment' ? C.blue : C.border}`, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
              >
                Back Camera
              </button>
            </div>

            <button 
              onClick={() => {
                if (!isBodyweightEx && (!currentWeightValue || Number(currentWeightValue) <= 0)) {
                  setWeightError("Please enter a valid weight before starting set assessment!");
                  return;
                }
                setWeightError("");
                navigate('/workout', { 
                  state: { 
                    exercise: currentExerciseObj.trackingKey || currentExerciseObj.key, 
                    facingMode,
                    setIndex: activeSetIndex,
                    date: dateKeyStr,
                    weight: isBodyweightEx ? 0 : Number(currentWeightValue),
                    userId // 🔑 Pass the active verified userId to the workout/camera view state
                  } 
                });
              }} 
              style={{ width: "100%", background: C.blue, color: "#fff", border: "none", borderRadius: 10, padding: "14px 0", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}
            >
              📷 Assess Form Live (Camera Engine) — Set {activeSetIndex + 1}
            </button>
            
            <button 
              onClick={() => setShowAiModal(true)}
              style={{ width: "100%", background: "transparent", border: `1px solid ${C.lime}`, color: C.lime, borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              🤖 AI Coach Form Review
            </button>
          </div>
        )}

      </div>

      {/* AI Coach Modal */}
      {showAiModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }} onClick={() => setShowAiModal(false)}>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "16px", width: "100%", maxWidth: "550px", height: "80vh", overflow: "hidden", position: "relative" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800, color: C.lime }}>AI Coach Chat</div>
              <button onClick={() => setShowAiModal(false)} style={{ background: "none", border: "none", color: C.sub, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            
            <div style={{ padding: 20, textAlign: "center", color: C.sub, fontSize: 14, marginTop: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🤖</div>
              <p>AI Coach ready for your {currentExerciseObj.name} feedback.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
