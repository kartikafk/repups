import { useRef, useState, useCallback, useMemo } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import {
  LM,
  EXERCISES,
  HOLD_EXERCISES,
  checkHoldPosition,
  computeAngles,
  issueLabel,
  issueVoiceLine,
  issueDescription
} from '../exercises';

const PAUSE_VELOCITY_THRESHOLD = 4;

// Exercise groups so form-coaching checks (valgus, lean, asymmetry, etc.)
// apply to all variants of a movement, not just one exact name.
const SQUAT_VALGUS_LEAN_EXERCISES = [
  'squat', 'deepSquat', 'jumpSquat', 'gobletSquat', 'bulgarianSplitSquat'
];

const SQUAT_LUNGE_ASYMMETRY_EXERCISES = [
  'squat', 'deepSquat', 'jumpSquat',
  'lunge', 'walkingLunge', 'reverseLunge', 'bulgarianSplitSquat', 'gobletSquat'
];
const SHOULDER_PRESS_EXERCISES = ['shoulderPress', 'arnoldPress', 'militaryPress'];
const DEADLIFT_LEAN_EXERCISES = ['deadlift', 'romanianDeadlift', 'stiffLegDeadlift'];

export function usePoseTracker({ exercise, voiceOn }) {
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const replayURLRef = useRef(null);
  const recordedBlobRef = useRef(null); // raw Blob — needed to persist to IndexedDB
  const canvasStreamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const streamRef = useRef(null);
  const startPromiseRef = useRef(null);

  const repStateRef = useRef('top');
  const angleHistoryRef = useRef([]);
  const phaseStartRef = useRef({ ecc: 0, pause: 0, con: 0 });
  const phaseDurRef = useRef({ ecc: 0, pause: 0, con: 0 });
  const minAngleRef = useRef(999);
  const repsRef = useRef([]);
  const sessionIssuesRef = useRef({});
  const lastCueTimeRef = useRef(0);

  /* --------------------------
   HOLD / ISOMETRIC TIMER REFS
  ---------------------------*/

  const holdStateRef = useRef('waiting');      // 'waiting' | 'holding'
  const holdStartRef = useRef(0);
  const holdSessionsRef = useRef([]);          // [{ n, duration, issues }]
  const holdIssueFlagsRef = useRef({});        // issues seen during current hold attempt

  const [holdTime, setHoldTime] = useState(0);   // ms, live while holding
  const [bestHold, setBestHold] = useState(0);   // ms, best hold this session
  const [holdCount, setHoldCount] = useState(0);

  const isHoldExercise = useCallback(() => !!HOLD_EXERCISES[exercise], [exercise]);

  /* --------------------------
   ADVANCED BIOMECHANICS REFS
---------------------------*/

  const jointScoresRef = useRef({});

  const balanceRef = useRef({
    left: 50,
    right: 50
  });

  const comHistoryRef = useRef([]);

  const velocityHistoryRef = useRef([]);

  const motionTrailRef = useRef([]);

  const postureHistoryRef = useRef([]);

  const stabilityHistoryRef = useRef([]);

  const symmetryHistoryRef = useRef([]);

  const spineHistoryRef = useRef([]);

  const jointVelocityRef = useRef({});

  const movementQualityRef = useRef([]);

  const fatigueIndexRef = useRef(0);
  const smoothedLandmarksRef = useRef(null);
  const cameraViewRef = useRef("front");

  const SMOOTHING = 0.75; // 0.6 = responsive, 0.8 = smoother

  const [repCount, setRepCount] = useState(0);
  const [rom, setRom] = useState(null);
  const [tempo, setTempo] = useState(null);
  const [phase, setPhase] = useState('top');
  const [cue, setCue] = useState({ text: 'Get in frame to begin', kind: 'go' });
  const [hudStatus, setHudStatus] = useState('calibrating…');

  const cfg = useCallback(() => EXERCISES[exercise], [exercise]);

  const speak = useCallback(
    (text) => {
      if (!voiceOn) return;
      const now = Date.now();
      if (now - lastCueTimeRef.current < 1500) return;
      lastCueTimeRef.current = now;
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.05;
        u.pitch = 1.0;
        u.volume = 0.9;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch (e) {}
    },
    [voiceOn]
  );

  const noteIssue = (key, text) => {
    const store = sessionIssuesRef.current;
    store[key] = store[key] || { count: 0, text };
    store[key].count++;
  };

  function detectCameraView(lm) {

    const shoulderWidth =
        Math.abs(
            lm[LM.L_SHOULDER].x -
            lm[LM.R_SHOULDER].x
        );

    const hipWidth =
        Math.abs(
            lm[LM.L_HIP].x -
            lm[LM.R_HIP].x
        );

    if (
        shoulderWidth < 0.10 &&
        hipWidth < 0.08
    ) {
        return "side";
    }

    return "front";
  }

  function smoothLandmarks(current) {

    if (!smoothedLandmarksRef.current) {
        smoothedLandmarksRef.current = current.map(l => ({ ...l }));
        return current;
    }

    const previous = smoothedLandmarksRef.current;

    const smoothed = current.map((lm, i) => ({

        ...lm,

        x: previous[i].x * SMOOTHING + lm.x * (1 - SMOOTHING),

        y: previous[i].y * SMOOTHING + lm.y * (1 - SMOOTHING),

        z: previous[i].z * SMOOTHING + lm.z * (1 - SMOOTHING),

        visibility: lm.visibility,
        presence: lm.presence

    }));

    smoothedLandmarksRef.current = smoothed;

    return smoothed;
  }

  // =====================================================================
  // HOLD / ISOMETRIC PROCESSING
  // =====================================================================
  // Runs instead of processAngle/processSideAngle whenever the selected
  // exercise is a hold exercise. Every frame we check if the body is
  // currently satisfying the exercise's position checks:
  //   - If yes and we weren't already holding -> start a new hold, start recording.
  //   - If yes and we were already holding -> just update the live timer.
  //   - If no and we were holding -> the hold just broke: log its duration
  //     and the issues that broke it, reset to 'waiting'.
  //   - If no and we're still waiting -> surface the reason the user isn't
  //     in position yet.
  function processHold(angles, now) {
    const { inPosition, failedIssues } = checkHoldPosition(exercise, angles);
    const primaryIssue = failedIssues[0] || null;
    const state = holdStateRef.current;

    if (inPosition) {
      if (state === 'waiting') {
        holdStateRef.current = 'holding';
        holdStartRef.current = now;
        holdIssueFlagsRef.current = {};
        if (!mediaRecorderRef.current) {
          startRecording();
        }
        setCue({ text: 'Holding — nice position', kind: 'go' });
        speak('Hold it there');
      }
      const elapsed = now - holdStartRef.current;
      setHoldTime(elapsed);
      setHudStatus('HOLDING');
      setPhase('holding');
      return;
    }

    // Not currently in position
    if (state === 'holding') {
      // The hold just broke — log the completed attempt
      const duration = now - holdStartRef.current;
      const n = holdSessionsRef.current.length + 1;
      const issuesThisHold = Object.keys(holdIssueFlagsRef.current);

      holdSessionsRef.current.push({
        n,
        duration: Math.round(duration),
        issues: issuesThisHold
      });

      setHoldCount(n);
      setBestHold((prev) => Math.max(prev, Math.round(duration)));
      setHoldTime(0);
      holdStateRef.current = 'waiting';
      setHudStatus('RESET');
      setPhase('waiting');

      const label = primaryIssue ? issueLabel(primaryIssue) : 'Position broken';
      setCue({ text: label, kind: 'warn' });
      speak(primaryIssue ? issueVoiceLine(primaryIssue) : 'Reset your position');
    } else {
      // Still waiting to get into position for the first time / after a break
      if (primaryIssue) {
        setCue({ text: `Get into position: ${issueLabel(primaryIssue)}`, kind: 'warn' });
      } else {
        setCue({ text: 'Get into position to start hold', kind: 'go' });
      }
      setHudStatus('WAITING');
      setPhase('waiting');
    }

    // Track every issue flag seen (for the session issue tracker used in the report)
    failedIssues.forEach((f) => {
      holdIssueFlagsRef.current[f] = true;
      noteIssue(f, issueDescription(f));
    });
  }

  function completeRep(angles) {
    const c = cfg();
    const minAngle = minAngleRef.current;
    const phaseDur = phaseDurRef.current;
    const romAchieved = c.topAngle - minAngle;
    const fullDepth = minAngle <= c.goodDepth;

    let score = 100;
    const flags = [];
    if (cameraViewRef.current === "side") {

    if (angles.torsoAngle > 30) {

        score -= 10;
        flags.push("lean");

    }

    if (minAngleRef.current > cfg().goodDepth) {

        score -= 15;
        flags.push("depth");

    }

    }
    if (!fullDepth) {
      score -= Math.min(35, (minAngle - c.goodDepth) * 1.2);
      flags.push('depth');
      noteIssue('depth', issueDescription('depth'));
    }
    if (phaseDur.ecc < 300) {
      score -= 15;
      flags.push('fast_ecc');
      noteIssue('fast_ecc', issueDescription('fast_ecc'));
    }
    if (angles.kneeAngleAsym > 12 && SQUAT_LUNGE_ASYMMETRY_EXERCISES.includes(exercise)) {
      score -= 15;
      flags.push('asymmetry');
      noteIssue('asymmetry', issueDescription('asymmetry'));
    }
    if (angles.valgusRatio < 0.72 && SQUAT_VALGUS_LEAN_EXERCISES.includes(exercise)) {
      score -= 15;
      flags.push('valgus');
      noteIssue('valgus', issueDescription('valgus'));
    }
    if (angles.torsoAngle > 40 && SQUAT_VALGUS_LEAN_EXERCISES.includes(exercise)) {
      score -= 10;
      flags.push('lean');
      noteIssue('lean', issueDescription('lean'));
    }
    // Shoulder Press checks
    if (SHOULDER_PRESS_EXERCISES.includes(exercise)) {

      if (angles.shoulderAsym > 12) {
        score -= 15;
        flags.push('shoulder_asymmetry');
        noteIssue('shoulder_asymmetry', issueDescription('shoulder_asymmetry'));
      }

      if (angles.elbowFlare > 25) {
        score -= 10;
        flags.push('elbow_flare');
        noteIssue('elbow_flare', issueDescription('elbow_flare'));
      }

      if (angles.torsoAngle > 18) {
        score -= 10;
        flags.push('lean');
        noteIssue('lean', issueDescription('lean'));
      }
    }
    if (SHOULDER_PRESS_EXERCISES.includes(exercise)) {
        if (angles.shoulderPressAngle < 75) {
            flags.push("depth");
            noteIssue("depth", issueDescription("depth"));
        }

        if (angles.elbowAngle < 60) {
            flags.push("lockout");
            noteIssue("lockout", "Extend your arms fully overhead.");
        }
    }

    if (DEADLIFT_LEAN_EXERCISES.includes(exercise)) {
        if (angles.torsoAngle > 40) {
            flags.push("lean");
            noteIssue("lean", issueDescription("lean"));
        }
    }

    if (exercise === "calfRaise") {
        if (angles.ankleAngle < 90) {
            flags.push("depth");
            noteIssue("depth", "Lift your heels higher.");
        }
    }
    score = Math.max(30, Math.round(score));

    const n = repsRef.current.length + 1;
    repsRef.current.push({
      n,
      ecc: phaseDur.ecc,
      pause: phaseDur.pause,
      con: phaseDur.con,
      rom: Math.round(romAchieved),
      score,
      flags
    });

    setRepCount(n);
    setRom(Math.round(romAchieved));
    setTempo({ ecc: phaseDur.ecc / 1000, pause: phaseDur.pause / 1000, con: phaseDur.con / 1000 });

    const praise = ['Clean rep — nice work', 'Good depth, keep it up', 'Solid control on that one'];
    speak(flags.length ? issueVoiceLine(flags[0]) : praise[Math.floor(Math.random() * praise.length)]);
    setCue({
      text: flags.length ? issueLabel(flags[0]) : 'Clean rep — nice work',
      kind: flags.length ? 'warn' : 'go'
    });
    minAngleRef.current = 999;
  }

  function processAngle(angle, angles, lm, now){
    const c = cfg();
    const hist = angleHistoryRef.current;
    hist.push({ t: now, a: angle });
    if (hist.length > 6) hist.shift();
    const velocity = hist.length >= 2 ? hist[hist.length - 1].a - hist[0].a : 0;
    //---------------------------------------------------
    // Joint Score Tracking (Normalized)
    //---------------------------------------------------

    const kneeScore = Math.max(
        0,
        100 - Math.min(angles.kneeAngleAsym * 4, 100)
    );

    const shoulderScore = Math.max(
        0,
        100 - Math.min(angles.shoulderAsym * 4, 100)
    );

    const spineScore = Math.max(
        0,
        100 - Math.min(Math.abs(angles.torsoAngle) * 2.5, 100)
    );

    const overallScore =
    (
        kneeScore * 0.40 +
        shoulderScore * 0.30 +
        spineScore * 0.30
    );

    jointScoresRef.current = {

        overall: Math.round(overallScore),

        knees: Math.round(kneeScore),

        shoulders: Math.round(shoulderScore),

        spine: Math.round(spineScore)

    };
    //---------------------------------------------------
    // Balance Detection (Center of Mass Projection)
    //---------------------------------------------------

    const pelvis = angles.virtual.pelvis;

    const leftFoot = lm[LM.L_ANKLE];
    const rightFoot = lm[LM.R_ANKLE];

    // midpoint between both feet
    const footCenterX = (leftFoot.x + rightFoot.x) / 2;

    // distance of pelvis from each foot
    const distLeft = Math.abs(pelvis.x - leftFoot.x);
    const distRight = Math.abs(rightFoot.x - pelvis.x);

    const total = distLeft + distRight;

    // Convert into approximate load distribution
    balanceRef.current = {
        left:
            total === 0
                ? 50
                : Math.max(
                      0,
                      Math.min(
                          100,
                          (distRight / total) * 100
                      )
                  ),

        right:
            total === 0
                ? 50
                : Math.max(
                      0,
                      Math.min(
                          100,
                          (distLeft / total) * 100
                      )
                  )
    };
    //---------------------------------------------------
    // Center of Mass History
    //---------------------------------------------------

    const com = angles.virtual.pelvis;

    comHistoryRef.current.push(com);

    //---------------------------------------------------
    // Motion Trail
    //---------------------------------------------------

    motionTrailRef.current.push(com);

    if(motionTrailRef.current.length>40){

        motionTrailRef.current.shift();

    }
    //---------------------------------------------------
    // Stability (COM Movement)
    //---------------------------------------------------

    if (comHistoryRef.current.length > 1) {

        const prev = comHistoryRef.current.at(-2);

        const dx = com.x - prev.x;
        const dy = com.y - prev.y;

        const sway = Math.sqrt(dx * dx + dy * dy);

        stabilityHistoryRef.current.push(sway);

        if (stabilityHistoryRef.current.length > 120) {
            stabilityHistoryRef.current.shift();
        }
    }
    //---------------------------------------------------
    // Symmetry
    //---------------------------------------------------

    symmetryHistoryRef.current.push(

        angles.kneeAngleAsym

    );

    if(symmetryHistoryRef.current.length>120){

        symmetryHistoryRef.current.shift();

    }
    //---------------------------------------------------
    // Spine History
    //---------------------------------------------------

    spineHistoryRef.current.push(

        angles.torsoAngle

    );

    if(spineHistoryRef.current.length>120){

        spineHistoryRef.current.shift();

    }
    //---------------------------------------------------
    // Fatigue Index (Velocity + ROM + Symmetry + Stability)
    //---------------------------------------------------

    const velocityScore = Math.min(
        100,
        Math.abs(velocity) * 4
    );

    const romScore = Math.min(
        100,
        ((cfg().topAngle - minAngleRef.current) / cfg().topAngle) * 100
    );

    const symmetryScore = Math.max(
        0,
        100 - angles.kneeAngleAsym * 3
    );

    const stabilityScore = Math.max(
        0,
        100 - Math.abs(velocity) * 2
    );

    const qualityScore =
        velocityScore * 0.30 +
        romScore * 0.30 +
        symmetryScore * 0.20 +
        stabilityScore * 0.20;

    movementQualityRef.current.push(qualityScore);

    if (movementQualityRef.current.length > 120) {
        movementQualityRef.current.shift();
    }

    if (movementQualityRef.current.length >= 30) {

        const recent =
            movementQualityRef.current.slice(-30);

        const averageQuality =
            recent.reduce((a, b) => a + b, 0) /
            recent.length;

        fatigueIndexRef.current = Math.max(
            0,
            Math.min(
                100,
                100 - averageQuality
            )
        );
    }
    let state = repStateRef.current;

    if (state === 'top' && angle < c.topAngle - 8 && velocity < -PAUSE_VELOCITY_THRESHOLD) {
      state = 'descending';
      if (!mediaRecorderRef.current) {
        startRecording();
      }
      phaseStartRef.current.ecc = now;
      minAngleRef.current = angle;
    } else if (state === 'descending') {
      minAngleRef.current = Math.min(minAngleRef.current, angle);
      if (Math.abs(velocity) < PAUSE_VELOCITY_THRESHOLD && angle < c.topAngle - 20) {
        phaseDurRef.current.ecc = now - phaseStartRef.current.ecc;
        phaseStartRef.current.pause = now;
        state = 'paused';
      }
    } else if (state === 'paused') {
      minAngleRef.current = Math.min(minAngleRef.current, angle);
      if (velocity > PAUSE_VELOCITY_THRESHOLD) {
        phaseDurRef.current.pause = now - phaseStartRef.current.pause;
        phaseStartRef.current.con = now;
        state = 'ascending';
      }
    } else if (state === 'ascending') {
      if (angle > c.topAngle - 8) {
        phaseDurRef.current.con = now - phaseStartRef.current.con;
        completeRep(angles);
        state = 'top';
      }
    }

    repStateRef.current = state;
    setPhase(state);
    setHudStatus(state.toUpperCase());
  }

  function processSideAngle(angles, lm, now) {

    const c = cfg();

    const leftVisible =
        lm[LM.L_HIP].visibility >
        lm[LM.R_HIP].visibility;

    let primaryAngle;

    switch (exercise) {

        case "squat":
        case "lunge":
            primaryAngle =
                leftVisible
                    ? angles.leftKneeAngle
                    : angles.rightKneeAngle;
            break;

        case "deadlift":
            primaryAngle =
                leftVisible
                    ? angles.leftHipAngle
                    : angles.rightHipAngle;
            break;

        case "shoulderPress":
            primaryAngle =
                leftVisible
                    ? angles.leftElbowAngle
                    : angles.rightElbowAngle;
            break;

        case "calfRaise":
            primaryAngle =
                leftVisible
                    ? angles.leftAnkleAngle
                    : angles.rightAnkleAngle;
            break;

        default:
            primaryAngle =
                leftVisible
                    ? angles.leftKneeAngle
                    : angles.rightKneeAngle;
    }

    processAngle(
        primaryAngle,
        angles,
        lm,
        now
    );

  }

  function drawJoint(ctx, x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.setLineDash([4,4]);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  function drawMarker(ctx,x,y,color){
    ctx.beginPath();
    ctx.arc(x,y,4,0,Math.PI*2);
    ctx.fillStyle=color;
    ctx.fill();
  }

  function drawLabel(ctx,x,y,text){
    ctx.font="12px Inter";
    ctx.fillStyle="#FFFFFF";
    ctx.fillText(text,x+10,y-10);
  }

  function drawBone(ctx,a,b){
    ctx.beginPath();
    ctx.moveTo(a.x,a.y);
    ctx.lineTo(b.x,b.y);
    ctx.stroke();
  }

  function drawCOM(ctx, point){
    ctx.beginPath();
    ctx.arc(point.x,point.y,8,0,Math.PI*2);
    ctx.fillStyle="#C8FF4D";
    ctx.shadowBlur=18;
    ctx.shadowColor="#C8FF4D";
    ctx.fill();
    ctx.shadowBlur=0;
  }

  function drawTrail(ctx,history){
    ctx.strokeStyle="rgba(200,255,77,.25)";
    ctx.lineWidth=3;
    ctx.beginPath();
    history.forEach((p,i)=>{
      if(i===0){
        ctx.moveTo(p.x,p.y);
      }else{
        ctx.lineTo(p.x,p.y);
      }
    });
    ctx.stroke();
  }

  function drawAngleText(ctx,x,y,value){
    ctx.font="11px Space Mono";
    ctx.fillStyle="#00FFFF";
    ctx.fillText(`${Math.round(value)}°`,x,y);
  }

  function drawSkeleton(lm) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    function p(landmark) {
        return { x: landmark.x * w, y: landmark.y * h };
    }
   // --------------------
    const pts = {
    L_SHOULDER: p(lm[LM.L_SHOULDER]),
    R_SHOULDER: p(lm[LM.R_SHOULDER]),
    L_ELBOW: p(lm[LM.L_ELBOW]),
    R_ELBOW: p(lm[LM.R_ELBOW]),
    L_WRIST: p(lm[LM.L_WRIST]),
    R_WRIST: p(lm[LM.R_WRIST]),
    L_HIP: p(lm[LM.L_HIP]),
    R_HIP: p(lm[LM.R_HIP]),
    L_KNEE: p(lm[LM.L_KNEE]),
    R_KNEE: p(lm[LM.R_KNEE]),
    L_ANKLE: p(lm[LM.L_ANKLE]),
    R_ANKLE: p(lm[LM.R_ANKLE]),
    L_EAR: p(lm[LM.L_EAR]),
    R_EAR: p(lm[LM.R_EAR]),
    };
    // Virtual Biomechanical Joints
    // ---------- Virtual joints ----------

    const nose = lm[0];

    const leftShoulder = lm[LM.L_SHOULDER];
    const rightShoulder = lm[LM.R_SHOULDER];

    const leftHip = lm[LM.L_HIP];
    const rightHip = lm[LM.R_HIP];

    const leftKnee = lm[LM.L_KNEE];
    const rightKnee = lm[LM.R_KNEE];

    const neck = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };

    const chest = {
      x: neck.x,
      y: neck.y + ((leftHip.y + rightHip.y) / 2 - neck.y) * 0.35
    };

    const pelvis = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };

    const leftFemur = {
      x: (leftHip.x + leftKnee.x) / 2,
      y: (leftHip.y + leftKnee.y) / 2
    };

    const rightFemur = {
      x: (rightHip.x + rightKnee.x) / 2,
      y: (rightHip.y + rightKnee.y) / 2
    };

    const chin = {
      x: nose.x,
      y: nose.y + 0.045
    };
    ctx.clearRect(0, 0, w, h);


    //-------------------------------------------------------
    // Helpers
    //-------------------------------------------------------
    const virtual = computeAngles(lm).virtual;

    //-------------------------------------------------------
    // Draw Line Helper
    //-------------------------------------------------------

    function bone(a, b, width = 4) {

        ctx.beginPath();

        ctx.moveTo(a.x, a.y);

        ctx.lineTo(b.x, b.y);

        ctx.strokeStyle = "#C8FF4D";

        ctx.lineWidth = width;

        ctx.lineCap = "round";

        ctx.stroke();

    }

    //-------------------------------------------------------
    // Draw Dotted Joint
    //-------------------------------------------------------

    function joint(point, radius = 10) {

        ctx.save();

        ctx.beginPath();

        ctx.setLineDash([3,3]);

        ctx.strokeStyle = "#ffffff";

        ctx.lineWidth = 2;

        ctx.arc(point.x, point.y, radius, 0, Math.PI*2);

        ctx.stroke();

        ctx.setLineDash([]);

        ctx.beginPath();

        ctx.fillStyle="#C8FF4D";

        ctx.arc(point.x, point.y,3.5,0,Math.PI*2);

        ctx.fill();

        ctx.restore();

    }

    //-------------------------------------------------------
    // Convert everything to pixels
    //-------------------------------------------------------
    const V={};

    Object.keys(virtual).forEach(key=>{

        V[key]=p(virtual[key]);

    });

    //-------------------------------------------------------
    // Head
    //-------------------------------------------------------

    const headRadius=Math.max(
        18,
        Math.hypot(
            pts.L_EAR.x-pts.R_EAR.x,
            pts.L_EAR.y-pts.R_EAR.y
        )*.7
    );

    ctx.beginPath();

    ctx.strokeStyle="#ffffff";

    ctx.lineWidth=4;

    ctx.arc(
        V.head.x,
        V.head.y,
        headRadius,
        0,
        Math.PI*2
    );

    ctx.stroke();

    //-------------------------------------------------------
    // Spine
    //-------------------------------------------------------

    bone(V.neck,V.upperSpine,5);

    bone(V.upperSpine,V.midSpine,5);

    bone(V.midSpine,V.lowerSpine,5);

    bone(V.lowerSpine,V.pelvis,5);

    //-------------------------------------------------------
    // Clavicle
    //-------------------------------------------------------

    bone(
        pts.L_SHOULDER,
        pts.R_SHOULDER,
        5
    );

    bone(
        pts.L_SHOULDER,
        V.chest,
        3
    );

    bone(
        pts.R_SHOULDER,
        V.chest,
        3
    );

    //-------------------------------------------------------
    // Left Arm
    //-------------------------------------------------------

    bone(
        pts.L_SHOULDER,
        pts.L_ELBOW
    );

    bone(
        pts.L_ELBOW,
        pts.L_WRIST
    );

    //-------------------------------------------------------
    // Right Arm
    //-------------------------------------------------------

    bone(
        pts.R_SHOULDER,
        pts.R_ELBOW
    );

    bone(
        pts.R_ELBOW,
        pts.R_WRIST
    );

    //-------------------------------------------------------
    // Pelvis
    //-------------------------------------------------------

    bone(
        pts.L_HIP,
        pts.R_HIP,
        5
    );

    bone(
        V.lowerSpine,
        pts.L_HIP,
        3
    );

    bone(
        V.lowerSpine,
        pts.R_HIP,
        3
    );

    //-------------------------------------------------------
    // Left Leg
    //-------------------------------------------------------

    bone(
        pts.L_HIP,
        pts.L_KNEE
    );

    bone(
        pts.L_KNEE,
        pts.L_ANKLE
    );

    //-------------------------------------------------------
    // Right Leg
    //-------------------------------------------------------

    bone(
        pts.R_HIP,
        pts.R_KNEE
    );

    bone(
        pts.R_KNEE,
        pts.R_ANKLE
    );

    //-------------------------------------------------------
    // Neck
    //-------------------------------------------------------

    bone(
        V.head,
        V.neck,
        4
    );

    bone(
        V.neck,
        V.chest,
        3
    );

    //-------------------------------------------------------
    // Joints
    //-------------------------------------------------------

    joint(V.head,14);

    joint(V.chin);

    joint(V.neck);

    joint(V.chest);

    joint(V.upperSpine);

    joint(V.midSpine);

    joint(V.lowerSpine);

    joint(V.pelvis);

    joint(pts.L_SHOULDER);

    joint(pts.R_SHOULDER);

    joint(pts.L_ELBOW);

    joint(pts.R_ELBOW);

    joint(pts.L_WRIST);

    joint(pts.R_WRIST);

    joint(pts.L_HIP);

    joint(pts.R_HIP);

    joint(pts.L_KNEE);

    joint(pts.R_KNEE);

    joint(pts.L_ANKLE);

    joint(pts.R_ANKLE);
    //-------------------------------------------------------
    // Center of Mass
    //-------------------------------------------------------

    if (comHistoryRef.current.length) {

        const latest = p(comHistoryRef.current.at(-1));

        drawCOM(ctx, latest);

    }
    //-------------------------------------------------------
    // Motion Trail
    //-------------------------------------------------------

    if (motionTrailRef.current.length > 2) {

        drawTrail(

            ctx,

            motionTrailRef.current.map(p)

        );

    }
    //-------------------------------------------------------
    // Joint Angles
    //-------------------------------------------------------

    const angles = computeAngles(lm);
    const kneeAngleAsym = angles.kneeAngleAsym;
    const shoulderAsym = angles.shoulderAsym;
    //---------------------------------------------------
    // Torso Angle
    //---------------------------------------------------

    const torsoVector = {
        x: neck.x - pelvis.x,
        y: neck.y - pelvis.y
    };

    const torsoAngle =
        Math.abs(
            Math.atan2(torsoVector.x, -torsoVector.y) *
            180 /
            Math.PI
        );



    drawAngleText(

        ctx,

        pts.L_KNEE.x,

        pts.L_KNEE.y,

        angles.kneeAngle

    );

    drawAngleText(

        ctx,

        pts.L_ELBOW.x,

        pts.L_ELBOW.y,

        angles.elbowAngle

    );

    drawAngleText(

        ctx,

        pts.L_HIP.x,

        pts.L_HIP.y,

        angles.hipAngle

    );
    //-------------------------------------------------------
    // BIOMECHANICS HUD
    //-------------------------------------------------------

    ctx.save();

    const panelX = 20;
    const panelY = 20;
    const panelW = 240;
    const panelH = isHoldExercise() ? 215 : 185;

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(panelX, panelY, panelW, panelH);

    ctx.strokeStyle = "#C8FF4D";
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.font = "bold 18px Inter";
    ctx.fillStyle = "#C8FF4D";
    ctx.fillText("BIOMECHANICS", panelX + 15, panelY + 28);

    ctx.font = "14px Inter";

    const rows = [
        ["Overall Score", `${Math.round(jointScoresRef.current.overall || 0)}`],
        ["Left Balance", `${balanceRef.current.left.toFixed(0)} %`],
        ["Right Balance", `${balanceRef.current.right.toFixed(0)} %`],
        ["Fatigue", `${fatigueIndexRef.current.toFixed(0)} %`],
        ["Torso", `${angles.torsoAngle.toFixed(1)}°`],
        ["Symmetry", `${angles.kneeAngleAsym.toFixed(1)}°`],
        ["Neck", `${angles.neckAngle.toFixed(1)}°`]
    ];

    if (isHoldExercise()) {
        const liveSeconds = (holdStateRef.current === 'holding'
            ? (performance.now() - holdStartRef.current)
            : 0) / 1000;
        rows.push(["Hold Time", `${liveSeconds.toFixed(1)}s`]);
    }

    rows.forEach((r, i) => {

        const y = panelY + 58 + i * 22;

        ctx.fillStyle = "#AAAAAA";
        ctx.fillText(r[0], panelX + 12, y);

        ctx.fillStyle = "#FFFFFF";
    const value = parseFloat(r[1]);

    ctx.fillStyle = "#2d2d2d";
    ctx.fillRect(panelX + 145, y - 11, 70, 10);

    ctx.fillStyle =
        value > 85
            ? "#66FF66"
            : value > 70
            ? "#FFD966"
            : "#FF6666";

    ctx.fillRect(panelX + 145, y - 11, Math.min(70, value * 0.7), 10);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(r[1], panelX + 220, y);
    });

    ctx.restore();
    //-------------------------------------------------------
    // Symmetry
    //-------------------------------------------------------

    ctx.fillStyle = "#FF6666";

    ctx.fillText(

        `Sym ${angles.kneeAngleAsym.toFixed(1)}°`,

        20,

        135

    );
    //-------------------------------------------------------
    // Neck
    //-------------------------------------------------------

    ctx.fillStyle = "#66FF66";

    ctx.fillText(

        `Neck ${angles.neckAngle.toFixed(1)}°`,

        20,

        155

    );
  }

  const stopActiveStream = useCallback(() => {
    const video = videoRef.current;

    if (video) {
      try {
        if (video.srcObject) {
          video.srcObject.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        }
        video.pause();
        video.onloadedmetadata = null;
        video.onpause = null;
        video.onended = null;
        video.onerror = null;
        video.onstalled = null;
        video.removeAttribute('src');
        video.load();
      } catch (err) {
        console.warn('Video cleanup failed', err);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    videoRef.current = null;
  }, []);

  const formatCameraErrorDetail = useCallback((message = '') => {
    const m = String(message || '').toLowerCase();

    if (m.includes('permission') || m.includes('notallowederror') || m.includes('denied')) {
      return 'Camera permission was denied. Please allow camera access in your browser settings.';
    }

    if (m.includes('device in use') || m.includes('in use') || m.includes('track already in use') || m.includes('busy')) {
      return 'Camera is already in use by another app or tab. Close it and try again.';
    }

    if (m.includes('notfounderror') || m.includes('no camera') || m.includes('no device')) {
      return 'No camera was found on this device.';
    }

    if (m.includes('srcobject') || m.includes('cannot set properties of null') || m.includes('preview element')) {
      return 'Camera preview could not be started. Please refresh the page and try again.';
    }

    return message || 'Camera could not be started.';
  }, []);

  // ---------------------------------------------------
  // Recording (fixed): guarded start/stop, no stray
  // top-level call, cleans up the canvas stream + old
  // blob URL, and resets state on every new session.
  // ---------------------------------------------------
  function startRecording() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Clean up any previous recorder before starting a new one
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    recordedChunksRef.current = [];

    canvasStreamRef.current = canvas.captureStream(30);

    mediaRecorderRef.current = new MediaRecorder(
      canvasStreamRef.current,
      { mimeType: 'video/webm' }
    );

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      recordedBlobRef.current = blob;

      if (replayURLRef.current) {
        URL.revokeObjectURL(replayURLRef.current);
      }
      replayURLRef.current = URL.createObjectURL(blob);

      if (canvasStreamRef.current) {
        canvasStreamRef.current.getTracks().forEach((track) => track.stop());
        canvasStreamRef.current = null;
      }
    };

    mediaRecorderRef.current.start();
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      return Promise.resolve();
    }

    // recorder.stop() is asynchronous — the browser fires
    // 'dataavailable' then 'stop' on a later tick, not synchronously.
    // The existing onstop handler (below, in startRecording) is what
    // actually builds the Blob and assigns recordedBlobRef.current /
    // replayURLRef.current. We chain onto it here so callers can await
    // the point where those refs are guaranteed to be populated.
    return new Promise((resolve) => {
      const existingOnStop = recorder.onstop;
      recorder.onstop = (event) => {
        if (existingOnStop) existingOnStop(event);
        resolve();
      };
      try {
        recorder.stop();
      } catch (e) {
        console.warn('stopRecording failed', e);
        resolve();
      }
    });
  }

  // Explicitly discards the last recording. Call this whenever the user
  // leaves the report/preview without an explicit save/export action, so
  // the blob doesn't just sit in memory until the tab closes.
  const clearReplay = useCallback(() => {
    if (replayURLRef.current) {
      URL.revokeObjectURL(replayURLRef.current);
      replayURLRef.current = null;
    }
    recordedChunksRef.current = [];
    recordedBlobRef.current = null;
  }, []);

  function loop() {
    if (!runningRef.current) return;
    try {
      const now = performance.now();
      const video = videoRef.current;
      const landmarker = poseLandmarkerRef.current;
      if (video && landmarker) {
        const result = landmarker.detectForVideo(video, now);
        if (result.landmarks && result.landmarks.length > 0) {
          const lm = smoothLandmarks(result.landmarks[0]);

          cameraViewRef.current = detectCameraView(lm);

          drawSkeleton(lm);

          const biomechanics = computeAngles(lm);

          const angles = biomechanics;

          if (isHoldExercise()) {

              processHold(
                  angles,
                  now
              );

          } else {

              const c = cfg();
              if (cameraViewRef.current === "front") {

                  processAngle(
                      angles[c.primaryAngle],
                      angles,
                      lm,
                      now
                  );

              } else {

                  processSideAngle(
                      angles,
                      lm,
                      now
                  );

              }

          }
        } else {
          const canvas = canvasRef.current;
          if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          setCue({ text: 'Move into frame — full body visible', kind: 'warn' });
        }
      }
    } catch (error) {
      console.error('Pose tracker loop error:', error);
    } finally {
      rafRef.current = requestAnimationFrame(loop);
    }
  }

  const start = useCallback(async (facingMode = "user", videoElement = null) => {
    if (startPromiseRef.current) {
      return startPromiseRef.current;
    }

    console.log('[usePoseTracker] start invoked', { facingMode, hasVideo: !!videoElement || !!videoRef.current });

    const startPromise = (async () => {
      if (runningRef.current) {
        stopActiveStream();
        runningRef.current = false;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      } else {
        stopActiveStream();
      }

      repStateRef.current = 'top';
      angleHistoryRef.current = [];
      phaseStartRef.current = { ecc: 0, pause: 0, con: 0 };
      phaseDurRef.current = { ecc: 0, pause: 0, con: 0 };
      minAngleRef.current = 999;
      repsRef.current = [];
      sessionIssuesRef.current = {};
      smoothedLandmarksRef.current = null;

      // Reset hold-timer state for a fresh session
      holdStateRef.current = 'waiting';
      holdStartRef.current = 0;
      holdSessionsRef.current = [];
      holdIssueFlagsRef.current = {};
      setHoldTime(0);
      setBestHold(0);
      setHoldCount(0);

      // Reset recording state for a fresh session
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      mediaRecorderRef.current = null;
      recordedChunksRef.current = [];
      recordedBlobRef.current = null;
      if (canvasStreamRef.current) {
        canvasStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      canvasStreamRef.current = null;
      if (replayURLRef.current) {
        URL.revokeObjectURL(replayURLRef.current);
      }
      replayURLRef.current = null;

      setRepCount(0);
      setRom(null);
      setTempo(null);

      setCue({
        text: 'Get in frame to begin',
        kind: 'go'
      });

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API unavailable. Open using localhost:5173 or HTTPS');
        }

        let video = videoElement || videoRef.current;
        console.log('[usePoseTracker] waiting for video ref', { video });

        for (let attempt = 0; attempt < 20 && !video; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          video = videoElement || videoRef.current;
        }

        if (video) {
          videoRef.current = video;
        }

        console.log('[usePoseTracker] video ref resolved', videoRef.current);

        if (!video || !(video instanceof HTMLVideoElement)) {
          throw new Error('Camera preview element was not ready. Please try again.');
        }

        let stream;
        try {
          console.log('[usePoseTracker] requesting camera stream');
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
        } catch (permissionError) {
          console.error('getUserMedia failed:', permissionError);
          throw new Error(
            permissionError?.name === 'NotAllowedError'
              ? 'Camera permission was denied. Please allow camera access in Edge and refresh the page.'
              : permissionError?.name === 'NotFoundError'
                ? 'No camera was found on this device.'
                : permissionError?.message || 'Camera access failed.'
          );
        }

        if (!video) {
          throw new Error('Camera preview element was not ready. Please try again.');
        }

        streamRef.current = stream;
        console.log('[usePoseTracker] attaching stream to video', { video });

        if (!video) {
          throw new Error('Video element disappeared before attaching camera.');
        }

        try {
          if (video.srcObject) {
            try {
              video.srcObject.getTracks().forEach((track) => track.stop());
            } catch (e) {
              console.warn('Failed to stop previous video stream', e);
            }
            video.srcObject = null;
          }

          if ('srcObject' in video) {
            video.srcObject = stream;
          } else {
            try {
              // eslint-disable-next-line deprecation/deprecation
              video.src = window.URL.createObjectURL(stream);
            } catch (e) {
              video.src = '';
            }
          }
          video.muted = true;
          video.autoplay = true;
          video.playsInline = true;

          await video.play().catch(() => {});
        } catch (err) {
          console.warn('Failed to attach stream to video element', err);
          stopActiveStream();
          throw new Error('Camera stream was not attached to the video element.');
        }

        console.log('STREAM ATTACHED SUCCESSFULLY');

        const recoverPlayback = () => {
          if (runningRef.current && video.srcObject) {
            console.warn('Video lost playback, attempting recovery.');
            Promise.resolve().then(() => video.play().catch(() => {}));
          }
        };

        video.onpause = recoverPlayback;
        video.onended = recoverPlayback;
        video.onerror = recoverPlayback;
        video.onstalled = recoverPlayback;

        await new Promise((resolve) => requestAnimationFrame(() => resolve()));

        if (!video.srcObject) {
          throw new Error('Camera stream was not attached to the video element.');
        }

        console.log('CAMERA STREAM CREATED', stream);

        await new Promise((resolve, reject) => {
          const finish = async () => {
            try {
              await video.play().catch(() => {});
              console.log('VIDEO PLAYING', video.videoWidth, video.videoHeight);
              resolve();
            } catch (err) {
              reject(err);
            }
          };

          const onMetadata = () => {
            video.removeEventListener('loadedmetadata', onMetadata);
            video.removeEventListener('loadeddata', onMetadata);
            finish();
          };

          video.addEventListener('loadedmetadata', onMetadata, { once: true });
          video.addEventListener('loadeddata', onMetadata, { once: true });

          if (video.readyState >= 2 || video.videoWidth > 0 || video.videoHeight > 0) {
            onMetadata();
          } else {
            window.setTimeout(() => {
              if (video.readyState >= 2 || video.videoWidth > 0 || video.videoHeight > 0) {
                onMetadata();
              } else {
                finish();
              }
            }, 3000);
          }
        });

        if (!poseLandmarkerRef.current) {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
          );

          poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
                delegate: 'GPU'
              },
              runningMode: 'VIDEO',
              numPoses: 1
            }
          );
        }

        const canvas = canvasRef.current;
        if (canvas) {
          const ratio = window.devicePixelRatio || 1;
          canvas.width = canvas.clientWidth * ratio;
          canvas.height = canvas.clientHeight * ratio;
        }

        runningRef.current = true;
        requestAnimationFrame(loop);
      } catch (error) {
        console.error('Camera/model error:', error);
        stopActiveStream();

        const message = error?.message || 'Unknown error';
        const detail = formatCameraErrorDetail(message);

        setCue({
          text: detail,
          kind: 'bad'
        });
      }
    })();

    startPromiseRef.current = startPromise;

    return startPromise.finally(() => {
      if (startPromiseRef.current === startPromise) {
        startPromiseRef.current = null;
      }
    });
  }, [exercise]);

  const buildReport = useCallback(() => {
    const reps = repsRef.current;
    const n = reps.length;
    const avgScore = n ? Math.round(reps.reduce((s, r) => s + r.score, 0) / n) : 0;
    const avgEcc = n ? reps.reduce((s, r) => s + r.ecc, 0) / n / 1000 : 0;
    const avgPause = n ? reps.reduce((s, r) => s + r.pause, 0) / n / 1000 : 0;
    const avgCon = n ? reps.reduce((s, r) => s + r.con, 0) / n / 1000 : 0;
    const avgRom = n ? Math.round(reps.reduce((s, r) => s + r.rom, 0) / n) : 0;
    const romVals = reps.map((r) => r.rom);
    const consistency = n > 1 ? Math.max(0, 100 - (Math.max(...romVals) - Math.min(...romVals)) * 1.5) : n ? 100 : 0;

    const topIssues = Object.entries(sessionIssuesRef.current)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([key, val]) => ({ key, label: issueLabel(key), count: val.count }));

    // Hold-exercise specific aggregates. Empty/zero for rep-based exercises.
    const holds = holdSessionsRef.current;
    const totalHoldTime = holds.reduce((s, h) => s + h.duration, 0);
    const bestHoldMs = holds.length ? Math.max(...holds.map((h) => h.duration)) : 0;

    return {
      exercise,
      isHold: isHoldExercise(),
      reps,
      repCount: n,

      avgScore,

      avgTempo: {
        ecc: avgEcc,
        pause: avgPause,
        con: avgCon,
        replay: replayURLRef.current
      },

      // Raw Blob for persistence (e.g. saving to IndexedDB). The
      // `replay` field above is just a temporary in-memory URL for
      // this session and won't survive a page reload.
      videoBlob: recordedBlobRef.current,

      avgRom,

      consistency: Math.round(consistency),

      topIssues,

      // -----------------------
      // HOLD / ISOMETRIC DATA
      // -----------------------

      holds,
      holdCount: holds.length,
      bestHold: bestHoldMs,
      totalHoldTime,

      // -----------------------
      // BIOMECHANICS DATA
      // -----------------------

      jointScores: jointScoresRef.current,

      balance: balanceRef.current,

      fatigue: fatigueIndexRef.current,

      movementQuality:
        movementQualityRef.current.length
          ? movementQualityRef.current.reduce((a, b) => a + b, 0) /
            movementQualityRef.current.length
          : 0,

      stability:
        stabilityHistoryRef.current.length
          ? stabilityHistoryRef.current.reduce((a, b) => a + b, 0) /
            stabilityHistoryRef.current.length
          : 0,

      symmetry:
        symmetryHistoryRef.current.length
          ? symmetryHistoryRef.current.reduce((a, b) => a + b, 0) /
            symmetryHistoryRef.current.length
          : 0
    };
  }, [exercise, isHoldExercise]);

  const stop = useCallback(async () => {
    runningRef.current = false;

    if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
    }

    smoothedLandmarksRef.current = null;

    // If a hold was in progress when stop() was called, log it as a
    // completed attempt so it shows up in the report instead of being lost.
    if (holdStateRef.current === 'holding') {
      const duration = performance.now() - holdStartRef.current;
      const n = holdSessionsRef.current.length + 1;
      holdSessionsRef.current.push({
        n,
        duration: Math.round(duration),
        issues: Object.keys(holdIssueFlagsRef.current)
      });
      setHoldCount(n);
      setBestHold((prev) => Math.max(prev, Math.round(duration)));
      holdStateRef.current = 'waiting';
      setHoldTime(0);
    }

    // Finalize the recording and WAIT for onstop to actually build the
    // Blob and assign recordedBlobRef.current / replayURLRef.current
    // before returning — otherwise buildReport() (called right after
    // stop() in App.jsx) reads those refs before they're populated.
    await stopRecording();
    stopActiveStream();
  }, [stopActiveStream]);

  const tracker = useMemo(
    () => ({
      videoRef,
      canvasRef,
      start,
      stop,
      buildReport,
      clearReplay,

      repCount,
      rom,
      tempo,
      phase,
      cue,
      hudStatus,

      // hold-timer live state
      isHold: isHoldExercise(),
      holdTime,
      bestHold,
      holdCount,

      jointScores: jointScoresRef.current,
      balance: balanceRef.current,
      fatigue: fatigueIndexRef.current,

      movementQuality:
        movementQualityRef.current.length
          ? movementQualityRef.current.reduce((a,b)=>a+b,0) /
            movementQualityRef.current.length
          : 0,

      stability:
        stabilityHistoryRef.current.length
          ? stabilityHistoryRef.current.reduce((a,b)=>a+b,0) /
            stabilityHistoryRef.current.length
          : 0,

      symmetry:
        symmetryHistoryRef.current.length
          ? symmetryHistoryRef.current.reduce((a,b)=>a+b,0) /
            symmetryHistoryRef.current.length
          : 0,
      lastReplay: replayURLRef.current,
    }),
    [
      start,
      stop,
      buildReport,
      clearReplay,
      repCount,
      rom,
      tempo,
      phase,
      cue,
      hudStatus,
      isHoldExercise,
      holdTime,
      bestHold,
      holdCount
    ]
  );
  return tracker;
}