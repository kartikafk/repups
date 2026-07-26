// Mediapipe pose landmark indices
export const LM = {
  NOSE: 0,
  L_EYE_INNER: 1,
  L_EYE: 2,
  L_EYE_OUTER: 3,
  R_EYE_INNER: 4,
  R_EYE: 5,
  R_EYE_OUTER: 6,
  L_EAR: 7,
  R_EAR: 8,
  MOUTH_L: 9,
  MOUTH_R: 10,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_ELBOW: 13,
  R_ELBOW: 14,
  L_WRIST: 15,
  R_WRIST: 16,
  L_PINKY: 17,
  R_PINKY: 18,
  L_INDEX: 19,
  R_INDEX: 20,
  L_THUMB: 21,
  R_THUMB: 22,
  L_HIP: 23,
  R_HIP: 24,
  L_KNEE: 25,
  R_KNEE: 26,
  L_ANKLE: 27,
  R_ANKLE: 28,
  L_HEEL: 29,
  R_HEEL: 30,
  L_FOOT: 31,
  R_FOOT: 32
};

function midpoint(a,b){
    return{
        x:(a.x+b.x)/2,
        y:(a.y+b.y)/2,
        z:((a.z||0)+(b.z||0))/2
    };
}

function interpolate(a,b,t){
    return{
        x:a.x+(b.x-a.x)*t,
        y:a.y+(b.y-a.y)*t,
        z:(a.z||0)+((b.z||0)-(a.z||0))*t
    };
}

function distance(a,b){
    return Math.hypot(
        a.x-b.x,
        a.y-b.y
    );
}

function vector(a,b){
    return{
        x:b.x-a.x,
        y:b.y-a.y
    };
}

function normalize(v){
    const m=Math.hypot(v.x,v.y);
    if(m===0) return {x:0,y:0};
    return{
        x:v.x/m,
        y:v.y/m
    };
}

function buildVirtualJoints(lm){
    const shoulderMid=midpoint(lm[LM.L_SHOULDER], lm[LM.R_SHOULDER]);
    const hipMid=midpoint(lm[LM.L_HIP], lm[LM.R_HIP]);
    const neck=interpolate(shoulderMid, lm[LM.NOSE], 0.35);
    const chin=midpoint(lm[LM.MOUTH_L], lm[LM.MOUTH_R]);
    const head=interpolate(neck, lm[LM.NOSE], 1.15);
    const chest=interpolate(shoulderMid, hipMid, 0.22);
    const upperSpine=interpolate(shoulderMid, hipMid, 0.32);
    const midSpine=interpolate(shoulderMid, hipMid, 0.50);
    const lowerSpine=interpolate(shoulderMid, hipMid, 0.72);
    const pelvis=hipMid;

    return{
        head, chin, neck, chest, upperSpine, midSpine, lowerSpine, pelvis, shoulderMid, hipMid
    };
}

// Exercise configs: which angle drives rep counting, and thresholds (degrees)
export const EXERCISES = {

  // ===========================
  // LOWER BODY
  // ===========================

  squat: {
    label: "SQUAT",
    primaryAngle: "kneeAngle",
    topAngle: 165,
    bottomAngle: 100,
    goodDepth: 110,
    compoundJoints: [
      { name: "hipAngle", min: 50, max: 120, flag: "hips_too_high" } 
    ]
  },
  deepSquat: {
    label: "DEEP SQUAT",
    primaryAngle: "kneeAngle",
    topAngle: 165,
    bottomAngle: 80,
    goodDepth: 90,
    compoundJoints: [
      { name: "hipAngle", min: 40, max: 100, flag: "hips_too_high" }
    ]
  },
  jumpSquat: {
    label: "JUMP SQUAT",
    primaryAngle: "kneeAngle",
    topAngle: 165,
    bottomAngle: 95,
    goodDepth: 105
  },
  lunge: {
    label: "LUNGE",
    primaryAngle: "kneeAngle",
    topAngle: 165,
    bottomAngle: 95,
    goodDepth: 105
  },
  walkingLunge: {
    label: "WALKING LUNGE",
    primaryAngle: "kneeAngle",
    topAngle: 165,
    bottomAngle: 95,
    goodDepth: 105
  },
  reverseLunge: {
    label: "REVERSE LUNGE",
    primaryAngle: "kneeAngle",
    topAngle: 165,
    bottomAngle: 95,
    goodDepth: 105
  },
  bulgarianSplitSquat: {
    label: "BULGARIAN SPLIT SQUAT",
    primaryAngle: "kneeAngle",
    topAngle: 165,
    bottomAngle: 90,
    goodDepth: 100
  },
  gobletSquat: {
    label: "GOBLET SQUAT",
    primaryAngle: "kneeAngle",
    topAngle: 165,
    bottomAngle: 100,
    goodDepth: 110,
    compoundJoints: [
      { name: "hipAngle", min: 50, max: 120, flag: "hips_too_high" }
    ]
  },
  legPress: {
    label: "LEG PRESS",
    primaryAngle: "kneeAngle",
    topAngle: 170,
    bottomAngle: 90,
    goodDepth: 100
  },
  hackSquat: {
    label: "HACK SQUAT",
    primaryAngle: "kneeAngle",
    topAngle: 170,
    bottomAngle: 90,
    goodDepth: 100
  },
  deadlift: {
    label: "DEADLIFT",
    primaryAngle: "hipAngle",
    topAngle: 175,
    bottomAngle: 75,
    goodDepth: 90,
    compoundJoints: [
      { name: "kneeAngle", min: 85, max: 135, flag: "knees_too_straight" } 
    ]
  },
  romanianDeadlift: {
    label: "ROMANIAN DEADLIFT",
    primaryAngle: "hipAngle",
    topAngle: 175,
    bottomAngle: 85,
    goodDepth: 95,
    compoundJoints: [
      { name: "kneeAngle", min: 140, max: 180, flag: "knees_too_bent" } 
    ]
  },
  stiffLegDeadlift: {
    label: "STIFF LEG DEADLIFT",
    primaryAngle: "hipAngle",
    topAngle: 175,
    bottomAngle: 80,
    goodDepth: 90,
    compoundJoints: [
      { name: "kneeAngle", min: 155, max: 180, flag: "knees_too_bent" } 
    ]
  },
  hipThrust: {
    label: "HIP THRUST",
    primaryAngle: "hipAngle",
    topAngle: 175,
    bottomAngle: 90,
    goodDepth: 100
  },
  gluteBridge: {
    label: "GLUTE BRIDGE",
    primaryAngle: "hipAngle",
    topAngle: 175,
    bottomAngle: 90,
    goodDepth: 100
  },
  calfRaise: {
    label: "CALF RAISE",
    primaryAngle: "ankleAngle",
    topAngle: 110,
    bottomAngle: 75,
    goodDepth: 85
  },
  legExtension: {
    label: "LEG EXTENSION",
    primaryAngle: "kneeAngle",
    topAngle: 175,
    bottomAngle: 90,
    goodDepth: 100
  },
  legCurl: {
    label: "LEG CURL",
    primaryAngle: "kneeAngle",
    topAngle: 175,
    bottomAngle: 65,
    goodDepth: 75
  },

  // ===========================
  // PUSH
  // ===========================

  pushup: {
    label: "PUSH-UP",
    primaryAngle: "elbowAngle",
    topAngle: 165,
    bottomAngle: 90,
    goodDepth: 100,
    compoundJoints: [
      { name: "torsoAngle", min: 0, max: 20, flag: "hip_sag" } 
    ]
  },
  benchPress: {
    label: "BENCH PRESS",
    primaryAngle: "elbowAngle",
    topAngle: 160,
    bottomAngle: 95,
    goodDepth: 85,
    compoundJoints: [
      { name: "shoulderAbduction", min: 40, max: 75, flag: "elbow_flare" } 
    ]
  },
  inclineBench: {
    label: "INCLINE BENCH",
    primaryAngle: "elbowAngle",
    topAngle: 160,
    bottomAngle: 95,
    goodDepth: 75
  },
  declineBench: {
    label: "DECLINE BENCH",
    primaryAngle: "elbowAngle",
    topAngle: 160,
    bottomAngle: 95,
    goodDepth: 85
  },
  chestPress: {
    label: "CHEST PRESS",
    primaryAngle: "elbowAngle",
    topAngle: 160,
    bottomAngle: 95,
    goodDepth: 80
  },
  shoulderPress: {
    label: "SHOULDER PRESS",
    primaryAngle: "shoulderPressAngle",
    topAngle: 155,
    bottomAngle: 85,
    goodDepth: 75
  },
  arnoldPress: {
    label: "ARNOLD PRESS",
    primaryAngle: "shoulderPressAngle",
    topAngle: 170,
    bottomAngle: 70,
    goodDepth: 80
  },
  militaryPress: {
    label: "MILITARY PRESS",
    primaryAngle: "shoulderPressAngle",
    topAngle: 170,
    bottomAngle: 70,
    goodDepth: 80
  },
  lateralRaise: {
    label: "LATERAL RAISE",
    primaryAngle: "shoulderAbduction",
    topAngle: 90,
    bottomAngle: 10,
    goodDepth: 80
  },
  frontRaise: {
    label: "FRONT RAISE",
    primaryAngle: "shoulderFlexion",
    topAngle: 90,
    bottomAngle: 10,
    goodDepth: 80
  },
  rearDeltFly: {
    label: "REAR DELT FLY",
    primaryAngle: "shoulderHorizontal",
    topAngle: 90,
    bottomAngle: 20,
    goodDepth: 80
  },

  // ===========================
  // PULL
  // ===========================

  pullup: {
    label: "PULL-UP",
    primaryAngle: "elbowAngle",
    topAngle: 170,
    bottomAngle: 55,
    goodDepth: 65,
    compoundJoints: [
      { name: "shoulderFlexion", min: 0, max: 50, flag: "incomplete_pull" } 
    ]
  },
  chinup: {
    label: "CHIN-UP",
    primaryAngle: "elbowAngle",
    topAngle: 170,
    bottomAngle: 55,
    goodDepth: 65
  },
  latPulldown: {
    label: "LAT PULLDOWN",
    primaryAngle: "elbowAngle",
    topAngle: 170,
    bottomAngle: 60,
    goodDepth: 70
  },
  row: {
    label: "ROW",
    primaryAngle: "elbowAngle",
    topAngle: 165,
    bottomAngle: 70,
    goodDepth: 80,
    compoundJoints: [
      { name: "shoulderFlexion", min: 0, max: 40, flag: "incomplete_pull" } 
    ]
  },
  seatedRow: {
    label: "SEATED ROW",
    primaryAngle: "elbowAngle",
    topAngle: 165,
    bottomAngle: 70,
    goodDepth: 80
  },
  bentOverRow: {
    label: "BENT OVER ROW",
    primaryAngle: "elbowAngle",
    topAngle: 165,
    bottomAngle: 70,
    goodDepth: 80
  },
  facePull: {
    label: "FACE PULL",
    primaryAngle: "elbowAngle",
    topAngle: 150,
    bottomAngle: 60,
    goodDepth: 70
  },

  // ===========================
  // ARMS
  // ===========================

  curl: {
    label: "BICEP CURL",
    primaryAngle: "elbowAngleCurl",
    topAngle: 170,
    bottomAngle: 50,
    goodDepth: 60
  },
  hammerCurl: {
    label: "HAMMER CURL",
    primaryAngle: "elbowAngleCurl",
    topAngle: 170,
    bottomAngle: 50,
    goodDepth: 60
  },
  preacherCurl: {
    label: "PREACHER CURL",
    primaryAngle: "elbowAngleCurl",
    topAngle: 170,
    bottomAngle: 45,
    goodDepth: 55
  },
  concentrationCurl: {
    label: "CONCENTRATION CURL",
    primaryAngle: "elbowAngleCurl",
    topAngle: 170,
    bottomAngle: 45,
    goodDepth: 55
  },
  tricepsPushdown: {
    label: "TRICEPS PUSHDOWN",
    primaryAngle: "elbowAngle",
    topAngle: 170,
    bottomAngle: 70,
    goodDepth: 80
  },
  overheadExtension: {
    label: "OVERHEAD EXTENSION",
    primaryAngle: "elbowAngle",
    topAngle: 170,
    bottomAngle: 60,
    goodDepth: 70
  },
  skullCrusher: {
    label: "SKULL CRUSHER",
    primaryAngle: "elbowAngle",
    topAngle: 170,
    bottomAngle: 60,
    goodDepth: 70
  }

};

export function angleBetween(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  if (magAB === 0 || magCB === 0) return 180;
  let cos = dot / (magAB * magCB);
  cos = Math.max(-1, Math.min(1, cos));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function computeAngles(lm){
    const g=(i)=>lm[i];
    const virtual=buildVirtualJoints(lm);

    const kneeAngleL=angleBetween(g(LM.L_HIP), g(LM.L_KNEE), g(LM.L_ANKLE));
    const kneeAngleR=angleBetween(g(LM.R_HIP), g(LM.R_KNEE), g(LM.R_ANKLE));
    const elbowAngleL=angleBetween(g(LM.L_SHOULDER), g(LM.L_ELBOW), g(LM.L_WRIST));
    const elbowAngleR=angleBetween(g(LM.R_SHOULDER), g(LM.R_ELBOW), g(LM.R_WRIST));
    const shoulderPressAngleL=angleBetween(g(LM.L_ELBOW), g(LM.L_SHOULDER), g(LM.L_HIP));
    const shoulderPressAngleR=angleBetween(g(LM.R_ELBOW), g(LM.R_SHOULDER), g(LM.R_HIP));
    const armRaiseAngleL=angleBetween(g(LM.L_HIP), g(LM.L_SHOULDER), g(LM.L_ELBOW));
    const armRaiseAngleR=angleBetween(g(LM.R_HIP), g(LM.R_SHOULDER), g(LM.R_ELBOW));
    const hipAngleL=angleBetween(g(LM.L_SHOULDER), g(LM.L_HIP), g(LM.L_KNEE));
    const hipAngleR=angleBetween(g(LM.R_SHOULDER), g(LM.R_HIP), g(LM.R_KNEE));
    const ankleAngleL=angleBetween(g(LM.L_KNEE), g(LM.L_ANKLE), {x:g(LM.L_ANKLE).x, y:g(LM.L_ANKLE).y-.2});
    const ankleAngleR=angleBetween(g(LM.R_KNEE), g(LM.R_ANKLE), {x:g(LM.R_ANKLE).x, y:g(LM.R_ANKLE).y-.2});

    const shoulderMid=virtual.shoulderMid;
    const hipMid=virtual.hipMid;
    const spineVector=vector(hipMid, shoulderMid);
    const torsoAngle=Math.atan2(Math.abs(spineVector.x), Math.abs(spineVector.y))*180/Math.PI;
    const neckAngle=Math.atan2(Math.abs(virtual.head.x-virtual.neck.x), Math.abs(virtual.head.y-virtual.neck.y))*180/Math.PI;
    const shoulderLineAngle=Math.atan2(g(LM.R_SHOULDER).y-g(LM.L_SHOULDER).y, g(LM.R_SHOULDER).x-g(LM.L_SHOULDER).x)*180/Math.PI;
    const pelvisTilt=Math.atan2(g(LM.R_HIP).y-g(LM.L_HIP).y, g(LM.R_HIP).x-g(LM.L_HIP).x)*180/Math.PI;
    const shoulderAsym=Math.abs(g(LM.L_SHOULDER).y-g(LM.R_SHOULDER).y)*100;
    const hipAsym=Math.abs(g(LM.L_HIP).y-g(LM.R_HIP).y)*100;
    const kneeAsym=Math.abs(kneeAngleL-kneeAngleR);
    const elbowAsym=Math.abs(elbowAngleL-elbowAngleR);
    const ankleAsym=Math.abs(ankleAngleL-ankleAngleR);
    const elbowFlare=Math.abs(armRaiseAngleL-armRaiseAngleR);
    const kneeDistance=distance(g(LM.L_KNEE), g(LM.R_KNEE));
    const ankleDistance=distance(g(LM.L_ANKLE), g(LM.R_ANKLE));
    const valgusRatio=ankleDistance===0?1:kneeDistance/ankleDistance;
    const spineLeanUpper=angleBetween(virtual.neck, virtual.upperSpine, virtual.midSpine);
    const spineLeanLower=angleBetween(virtual.upperSpine, virtual.midSpine, virtual.lowerSpine);
    const headOffset=distance(virtual.head, virtual.neck);
    const wristAngleL=angleBetween(g(LM.L_ELBOW), g(LM.L_WRIST), {x: g(LM.L_WRIST).x, y: g(LM.L_WRIST).y - 0.15});
    const wristAngleR=angleBetween(g(LM.R_ELBOW), g(LM.R_WRIST), {x: g(LM.R_WRIST).x, y: g(LM.R_WRIST).y - 0.15});
    const wristAngle=(wristAngleL + wristAngleR) / 2;
    const shoulderFlexionL=angleBetween(g(LM.L_ELBOW), g(LM.L_SHOULDER), virtual.pelvis);
    const shoulderFlexionR=angleBetween(g(LM.R_ELBOW), g(LM.R_SHOULDER), virtual.pelvis);
    const shoulderFlexion=(shoulderFlexionL + shoulderFlexionR) / 2;
    const footWidth=distance(g(LM.L_ANKLE), g(LM.R_ANKLE));
    const hipWidth=distance(g(LM.L_HIP), g(LM.R_HIP));
    const stanceRatio=hipWidth === 0? 1: footWidth / hipWidth;
    const bodyMidline={x:(g(LM.L_SHOULDER).x + g(LM.R_SHOULDER).x + g(LM.L_HIP).x + g(LM.R_HIP).x) / 4, y:(g(LM.L_HIP).y + g(LM.R_HIP).y) / 2};
    const bodyRotation=Math.abs(shoulderLineAngle - pelvisTilt);

    const leftKneeAngle = kneeAngleL;
    const rightKneeAngle = kneeAngleR;
    const leftHipAngle = hipAngleL;
    const rightHipAngle = hipAngleR;
    const leftElbowAngle = elbowAngleL;
    const rightElbowAngle = elbowAngleR;
    const leftAnkleAngle = ankleAngleL;
    const rightAnkleAngle = ankleAngleR;
    const kneeAngle = (kneeAngleL + kneeAngleR) / 2;
    const hipAngle = (hipAngleL + hipAngleR) / 2;
    const elbowAngle = (elbowAngleL + elbowAngleR) / 2;
    const ankleAngle = (ankleAngleL + ankleAngleR) / 2;
    const shoulderAbduction = (armRaiseAngleL + armRaiseAngleR) / 2;
    const shoulderHorizontal = (armRaiseAngleL + armRaiseAngleR) / 2;

    return{
        virtual,
        kneeAngleAsym:kneeAsym,
        elbowAngleCurl: (elbowAngleL+elbowAngleR)/2,
        shoulderPressAngle: (shoulderPressAngleL+shoulderPressAngleR)/2,
        armRaiseAngle: (armRaiseAngleL+armRaiseAngleR)/2,
        frontRaiseAngle: (armRaiseAngleL+armRaiseAngleR)/2,
        torsoAngle, neckAngle, shoulderLineAngle, pelvisTilt, shoulderAsym, hipAsym,
        elbowAsym, ankleAsym, elbowFlare, valgusRatio, spineLeanUpper, spineLeanLower,
        headOffset, wristAngle, shoulderFlexion, leftKneeAngle, rightKneeAngle, leftHipAngle,
        rightHipAngle, leftElbowAngle, rightElbowAngle, leftAnkleAngle, rightAnkleAngle,
        kneeAngle, hipAngle, elbowAngle, ankleAngle, shoulderAbduction, shoulderHorizontal,
        stanceRatio, bodyMidline, bodyRotation,
    };
}

export function issueLabel(flag) {
  const lines = {
    depth: 'Go deeper for full range',
    fast_ecc: 'Control the lowering phase',
    asymmetry: 'Keep both sides even',
    valgus: 'Knees out, in line with toes',
    lean: 'Keep chest up, brace core',
    shoulder_asymmetry: 'Press both arms evenly',
    elbow_flare: 'Keep elbows under wrists',
    lockout: "Fully extend your arms",
    hips: "Drive through your hips",
    heels: "Keep your heels planted",
    hip_sag: 'Lift your hips — keep a straight line',
    hips_too_high: 'Drop your hips lower',
    knees_too_straight: 'Bend knees more (Conventional)',
    knees_too_bent: 'Keep legs straighter (RDL)',
    incomplete_pull: 'Pull all the way to chest',
  };
  return lines[flag] || 'Adjust form';
}

export function issueVoiceLine(flag) {
  const lines = {
    depth: 'Go deeper',
    fast_ecc: 'Slow down the lowering',
    asymmetry: 'Even out both sides',
    valgus: 'Push your knees out',
    lean: 'Chest up',
    shoulder_asymmetry:'One arm is pressing higher than the other. Keep both arms moving together.',
    elbow_flare:'Your elbows are flaring outward. Keep them directly under your wrists.',
    lockout: "Lock out your arms", 
    hips: "Drive your hips",
    heels: "Keep your heels down",
    hip_sag: 'Lift your hips',
    hips_too_high: 'Drop your hips, dont just bend your knees',
    knees_too_straight: 'Bend your knees more on the way down',
    knees_too_bent: 'Keep your legs stiffer',
    incomplete_pull: 'Full range of motion, pull to your chest',
  };
  return lines[flag] || 'Adjust form';
}

export function issueDescription(flag) {
  const lines = {
    depth: 'Not reaching full range of motion — go deeper for full credit.',
    fast_ecc: 'Lowering too fast — slow the eccentric (lowering) phase for more control and muscle tension.',
    asymmetry: 'One side is bending more than the other — keep weight even between both legs.',
    valgus: 'Knees are caving inward — push knees out in line with your toes.',
    lean: 'Excessive forward lean — keep your chest up and core braced.',
    lockout:"Fully extend your elbows at the top of the movement.",
    hips:"Drive the movement with your hips instead of your back.",
    heels:"Keep your heels planted throughout the movement.",
    hip_sag: 'Hips are sagging or piking — keep a straight line from shoulders to ankles.',
    hips_too_high: 'Your knees are bending but your hips are staying too high. Sink your hips down and back.',
    knees_too_straight: 'You are performing a stiff-leg deadlift. For a conventional deadlift, you must bend your knees to lower your hips.',
    knees_too_bent: 'You are squatting the weight. For an RDL, keep your knees relatively stiff to stretch the hamstrings.',
    incomplete_pull: 'You are relying entirely on elbow flexion. Pull your elbows further back to fully engage the lats.',
  };
  return lines[flag] || '';
}

// =====================================================================
// HOLD / ISOMETRIC EXERCISES
// =====================================================================
// These are NOT rep-based. Instead of tracking eccentric/pause/concentric
// phases, every frame we check whether the body currently satisfies every
// listed check for that hold. As long as all checks pass, time accumulates.
// The moment any check fails, the current hold attempt ends and gets
// logged with its duration and which checks broke it.
//
// check shape: { angle: <key from computeAngles()>, min?, max?, issue: <flag> }
// (issue must be a key handled by issueLabel/issueVoiceLine/issueDescription)
export const HOLD_EXERCISES = {
  plank: {
    label: 'PLANK',
    view: 'side',
    checks: [
      { angle: 'hipAngle', min: 160, issue: 'hip_sag' },
      { angle: 'torsoAngle', max: 20, issue: 'lean' }
    ]
  },
  sidePlank: {
    label: 'SIDE PLANK',
    view: 'side',
    checks: [
      { angle: 'hipAngle', min: 155, issue: 'hip_sag' }
    ]
  },
  wallSit: {
    label: 'WALL SIT',
    view: 'side',
    checks: [
      { angle: 'kneeAngle', min: 80, max: 100, issue: 'depth' },
      { angle: 'torsoAngle', max: 15, issue: 'lean' }
    ]
  },
  hollowHold: {
    label: 'HOLLOW HOLD',
    view: 'side',
    checks: [
      { angle: 'hipAngle', min: 45, max: 100, issue: 'depth' }
    ]
  },
  lSit: {
    label: 'L-SIT',
    view: 'side',
    checks: [
      { angle: 'hipAngle', min: 70, max: 110, issue: 'depth' },
      { angle: 'kneeAngle', min: 150, issue: 'lockout' }
    ]
  },
  deadBug: {
    label: 'DEAD BUG',
    view: 'side',
    checks: [
      { angle: 'torsoAngle', max: 20, issue: 'lean' }
    ]
  },
  birdDog: {
    label: 'BIRD DOG',
    view: 'side',
    checks: [
      { angle: 'torsoAngle', max: 20, issue: 'lean' }
    ]
  },
  dragonFlag: {
    label: 'DRAGON FLAG',
    view: 'side',
    checks: [
      { angle: 'hipAngle', min: 160, issue: 'hip_sag' }
    ]
  }
};

// Returns every failed check (not just the first) so the session issue
// tracker can log all of them, the same way completeRep() does for reps.
export function checkHoldPosition(exerciseKey, angles) {
  const cfg = HOLD_EXERCISES[exerciseKey];
  if (!cfg) return { inPosition: true, failedIssues: [] };

  const failedIssues = [];
  for (const check of cfg.checks) {
    const value = angles[check.angle];
    if (value === undefined) continue;
    if (check.min !== undefined && value < check.min) failedIssues.push(check.issue);
    else if (check.max !== undefined && value > check.max) failedIssues.push(check.issue);
  }
  return { inPosition: failedIssues.length === 0, failedIssues };
}

// =====================================================================
// CAMERA ANGLE GUIDANCE
// =====================================================================
// Shown to the user before they start the camera, since the front/side
// view detection and angle math both depend heavily on being positioned
// correctly relative to the camera.
export const CAMERA_ANGLE_HINTS = {
  squat: 'Side view works best — stand sideways to the camera, full body in frame.',
  deepSquat: 'Side view — stand sideways, full body in frame.',
  jumpSquat: 'Side view — stand sideways, full body in frame including landing space.',
  lunge: 'Side view — stand sideways so knee and hip angles are visible.',
  walkingLunge: 'Side view — camera far enough back to capture forward movement.',
  reverseLunge: 'Side view — stand sideways so knee and hip angles are visible.',
  bulgarianSplitSquat: 'Side view — rear foot elevated, full body in frame from the side.',
  gobletSquat: 'Side view — stand sideways, full body in frame.',
  legPress: 'Side view — full range of the machine and your legs visible in profile.',
  hackSquat: 'Side view — full body visible in profile against the machine.',
  deadlift: 'Side view — stand sideways, bar path and hip hinge need to be visible in profile.',
  romanianDeadlift: 'Side view — stand sideways to the camera.',
  stiffLegDeadlift: 'Side view — stand sideways to the camera.',
  hipThrust: 'Side view — full body visible, hips and shoulders in frame.',
  gluteBridge: 'Side view — full body visible on the floor/bench.',
  calfRaise: 'Side view — stand sideways so ankle angle is visible.',
  legExtension: 'Side view — full leg and machine visible in profile.',
  legCurl: 'Side view — full leg and machine visible in profile.',
  pushup: 'Side view — camera low, full body visible from head to feet.',
  benchPress: 'Side view — camera at chest height, sideways to the bench.',
  inclineBench: 'Side view — camera at chest height, sideways to the bench.',
  declineBench: 'Side view — camera at chest height, sideways to the bench.',
  chestPress: 'Side view — full body and machine visible in profile.',
  shoulderPress: 'Front view — face the camera directly, both arms visible.',
  arnoldPress: 'Front view — face the camera, both shoulders visible.',
  militaryPress: 'Front view — face the camera, both arms visible overhead.',
  lateralRaise: 'Front view — face the camera so both arms are visible raising to the sides.',
  frontRaise: 'Front or side view — either works, keep both arms in frame.',
  rearDeltFly: 'Side view — hinge forward, camera positioned to see the arm swing back.',
  pullup: 'Front or side view — make sure full arm extension is visible at the top and bottom.',
  chinup: 'Front or side view — make sure full arm extension is visible at the top and bottom.',
  latPulldown: 'Side view — full arm path and machine visible in profile.',
  row: 'Side view — full arm path visible in profile.',
  seatedRow: 'Side view — full arm path visible in profile.',
  bentOverRow: 'Side view — hinge visible, full arm path in profile.',
  facePull: 'Side view — full arm path visible in profile.',
  curl: 'Front view — face the camera, elbow should stay visible throughout.',
  hammerCurl: 'Front view — face the camera, elbow should stay visible throughout.',
  preacherCurl: 'Side view — full arm and bench visible in profile.',
  concentrationCurl: 'Side view — full arm visible in profile.',
  tricepsPushdown: 'Side view — full arm path visible in profile.',
  overheadExtension: 'Side view — full arm visible overhead and behind head.',
  skullCrusher: 'Side view — full arm visible lying down.',
  plank: 'Side view — camera low, full body visible head to feet in a straight line.',
  sidePlank: 'Side view — lie perpendicular to the camera so your side profile is visible.',
  wallSit: 'Side view — full legs and back visible against the wall.',
  hollowHold: 'Side view — full body visible, low camera angle.',
  lSit: 'Side view — full body visible, hands and legs both in frame.',
  deadBug: 'Side view, camera low — you will be lying down, so keep your full body in frame.',
  birdDog: 'Side view, camera low to the ground — detection reliability is limited for floor poses.',
  dragonFlag: 'Side view — full body visible, bench or floor included in frame.'
};

export function getCameraHint(exerciseKey) {
  return CAMERA_ANGLE_HINTS[exerciseKey] || 'Make sure your full body is visible in frame.';
}

// =====================================================================
// EXERCISE SELECTION LIBRARY
// =====================================================================
// This is a DISPLAY / SELECTION catalog for the StartScreen exercise
// picker (search, tabs, accordions). It is intentionally separate from
// the EXERCISES / HOLD_EXERCISES objects above, which drive the camera's
// biomechanics and only cover movements that have been tuned with real
// angle thresholds.
//
// Every entry here has a `trackable` flag:
//   - trackable: true, isHold: false/undefined -> `trackingKey` points at
//     a real entry in EXERCISES above (rep counting).
//   - trackable: true, isHold: true -> `trackingKey` points at a real
//     entry in HOLD_EXERCISES above (hold timer).
//   - trackable: false -> there is no tuned config for this movement yet.
//     It still shows up, is searchable, and calling setExercise(key) still
//     works, but the camera has nothing to key off of. StartScreen gates
//     the "Start camera" button on this flag.
//
// To add a new rep exercise: add ONE object here + a matching EXERCISES entry.
// To add a new hold exercise: add ONE object here (isHold: true) + a
// matching HOLD_EXERCISES entry.
export const EXERCISE_LIBRARY = [
  {
    key: 'benchPress',
    name: 'Bench Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'benchPress'
  },
  {
    key: 'inclineBenchPress',
    name: 'Incline Bench Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'inclineBench'
  },
  {
    key: 'declineBenchPress',
    name: 'Decline Bench Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'declineBench'
  },
  {
    key: 'dumbbellBenchPress',
    name: 'Dumbbell Bench Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Dumbbell',
    trackable: true,
    trackingKey: 'benchPress'
  },
  {
    key: 'inclineDumbbellPress',
    name: 'Incline Dumbbell Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Dumbbell',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'declineDumbbellPress',
    name: 'Decline Dumbbell Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Dumbbell',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'chestPressMachine',
    name: 'Chest Press Machine',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Machine',
    trackable: true,
    trackingKey: 'chestPress'
  },
  {
    key: 'pecDeck',
    name: 'Pec Deck',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Machine',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'cableFly',
    name: 'Cable Fly',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Cable',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'lowCableFly',
    name: 'Low Cable Fly',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Cable',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'highCableFly',
    name: 'High Cable Fly',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Cable',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'inclineFly',
    name: 'Incline Fly',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'declineFly',
    name: 'Decline Fly',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'dumbbellFly',
    name: 'Dumbbell Fly',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Dumbbell',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'svendPress',
    name: 'Svend Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Barbell',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'guillotinePress',
    name: 'Guillotine Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Chest'],
    equipment: 'Barbell',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'latPulldown',
    name: 'Lat Pulldown',
    aliases: ['Pulldown'],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'latPulldown'
  },
  {
    key: 'wideGripLatPulldown',
    name: 'Wide Grip Lat Pulldown',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'latPulldown'
  },
  {
    key: 'closeGripLatPulldown',
    name: 'Close Grip Lat Pulldown',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'latPulldown'
  },
  {
    key: 'neutralGripLatPulldown',
    name: 'Neutral Grip Lat Pulldown',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'latPulldown'
  },
  {
    key: 'assistedPullUpMachine',
    name: 'Assisted Pull Up Machine',
    aliases: ['Assisted Pull Up'],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Machine',
    trackable: true,
    trackingKey: 'chinup'
  },
  {
    key: 'barbellRow',
    name: 'Barbell Row',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'bentOverRow'
  },
  {
    key: 'pendlayRow',
    name: 'Pendlay Row',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'bentOverRow'
  },
  {
    key: 'tBarRow',
    name: 'T Bar Row',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'row'
  },
  {
    key: 'chestSupportedRow',
    name: 'Chest Supported Row',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'row'
  },
  {
    key: 'sealRow',
    name: 'Seal Row',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'row'
  },
  {
    key: 'cableRow',
    name: 'Cable Row',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Cable',
    trackable: true,
    trackingKey: 'seatedRow'
  },
  {
    key: 'singleArmCableRow',
    name: 'Single Arm Cable Row',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Cable',
    trackable: true,
    trackingKey: 'seatedRow'
  },
  {
    key: 'machineRow',
    name: 'Machine Row',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Machine',
    trackable: true,
    trackingKey: 'row'
  },
  {
    key: 'dumbbellRow',
    name: 'Dumbbell Row',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Dumbbell',
    trackable: true,
    trackingKey: 'row'
  },
  {
    key: 'meadowsRow',
    name: 'Meadows Row',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'row'
  },
  {
    key: 'deadlift',
    name: 'Deadlift',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'deadlift'
  },
  {
    key: 'romanianDeadlift',
    name: 'Romanian Deadlift',
    aliases: ['RDL'],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back', 'Hamstrings'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'romanianDeadlift'
  },
  {
    key: 'rackPull',
    name: 'Rack Pull',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Barbell',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'goodMorning',
    name: 'Good Morning',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back', 'Hamstrings'],
    equipment: 'Barbell',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'backExtension',
    name: 'Back Extension',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'facePull',
    name: 'Face Pull',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back', 'Shoulders'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'facePull'
  },
  {
    key: 'rearDeltFly',
    name: 'Rear Delt Fly',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back', 'Shoulders'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'rearDeltFly'
  },
  {
    key: 'reversePecDeck',
    name: 'Reverse Pec Deck',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back', 'Shoulders'],
    equipment: 'Machine',
    trackable: true,
    trackingKey: 'rearDeltFly'
  },
  {
    key: 'shrug',
    name: 'Shrug',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Barbell',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'uprightRow',
    name: 'Upright Row',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Back'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'row'
  },
  {
    key: 'overheadPress',
    name: 'Overhead Press',
    aliases: ['OHP'],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Shoulders'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'shoulderPress'
  },
  {
    key: 'seatedShoulderPress',
    name: 'Seated Shoulder Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Shoulders'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'shoulderPress'
  },
  {
    key: 'dumbbellShoulderPress',
    name: 'Dumbbell Shoulder Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Shoulders'],
    equipment: 'Dumbbell',
    trackable: true,
    trackingKey: 'shoulderPress'
  },
  {
    key: 'arnoldPress',
    name: 'Arnold Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Shoulders'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'arnoldPress'
  },
  {
    key: 'frontRaise',
    name: 'Front Raise',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Shoulders'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'frontRaise'
  },
  {
    key: 'plateFrontRaise',
    name: 'Plate Front Raise',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Shoulders'],
    equipment: 'Plate',
    trackable: true,
    trackingKey: 'frontRaise'
  },
  {
    key: 'lateralRaise',
    name: 'Lateral Raise',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Shoulders'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'lateralRaise'
  },
  {
    key: 'cableLateralRaise',
    name: 'Cable Lateral Raise',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Shoulders'],
    equipment: 'Cable',
    trackable: true,
    trackingKey: 'lateralRaise'
  },
  {
    key: 'machineLateralRaise',
    name: 'Machine Lateral Raise',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Shoulders'],
    equipment: 'Machine',
    trackable: true,
    trackingKey: 'lateralRaise'
  },
  {
    key: 'leaningCableRaise',
    name: 'Leaning Cable Raise',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Shoulders'],
    equipment: 'Cable',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'cableRearDeltFly',
    name: 'Cable Rear Delt Fly',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Shoulders'],
    equipment: 'Cable',
    trackable: true,
    trackingKey: 'rearDeltFly'
  },
  {
    key: 'barbellCurl',
    name: 'Barbell Curl',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Biceps'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'curl'
  },
  {
    key: 'eZBarCurl',
    name: 'EZ Bar Curl',
    aliases: ['EZ Curl'],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Biceps'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'curl'
  },
  {
    key: 'dumbbellCurl',
    name: 'Dumbbell Curl',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Biceps'],
    equipment: 'Dumbbell',
    trackable: true,
    trackingKey: 'curl'
  },
  {
    key: 'hammerCurl',
    name: 'Hammer Curl',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Biceps'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'hammerCurl'
  },
  {
    key: 'inclineCurl',
    name: 'Incline Curl',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Biceps'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'curl'
  },
  {
    key: 'preacherCurl',
    name: 'Preacher Curl',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Biceps'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'preacherCurl'
  },
  {
    key: 'spiderCurl',
    name: 'Spider Curl',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Biceps'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'curl'
  },
  {
    key: 'cableCurl',
    name: 'Cable Curl',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Biceps'],
    equipment: 'Cable',
    trackable: true,
    trackingKey: 'curl'
  },
  {
    key: 'bayesianCurl',
    name: 'Bayesian Curl',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Biceps'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'curl'
  },
  {
    key: 'concentrationCurl',
    name: 'Concentration Curl',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Biceps'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'concentrationCurl'
  },
  {
    key: 'machineCurl',
    name: 'Machine Curl',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Biceps'],
    equipment: 'Machine',
    trackable: true,
    trackingKey: 'curl'
  },
  {
    key: 'reverseCurl',
    name: 'Reverse Curl',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Biceps', 'Forearms'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'curl'
  },
  {
    key: 'pushdown',
    name: 'Pushdown',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Triceps'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'tricepsPushdown'
  },
  {
    key: 'ropePushdown',
    name: 'Rope Pushdown',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Triceps'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'tricepsPushdown'
  },
  {
    key: 'overheadExtension',
    name: 'Overhead Extension',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Triceps'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'overheadExtension'
  },
  {
    key: 'skullCrusher',
    name: 'Skull Crusher',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Triceps'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'skullCrusher'
  },
  {
    key: 'jMPress',
    name: 'JM Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Triceps'],
    equipment: 'Barbell',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'kickback',
    name: 'Kickback',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Triceps'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'closeGripBenchPress',
    name: 'Close Grip Bench Press',
    aliases: ['CGBP'],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Triceps'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'benchPress'
  },
  {
    key: 'cableExtension',
    name: 'Cable Extension',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Triceps'],
    equipment: 'Cable',
    trackable: true,
    trackingKey: 'overheadExtension'
  },
  {
    key: 'singleArmPushdown',
    name: 'Single Arm Pushdown',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Triceps'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'tricepsPushdown'
  },
  {
    key: 'machineDip',
    name: 'Machine Dip',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Triceps'],
    equipment: 'Machine',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'wristCurl',
    name: 'Wrist Curl',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Forearms'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: null
  },
 
  {
    key: 'farmerCarry',
    name: 'Farmer Carry',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Forearms'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'platePinch',
    name: 'Plate Pinch',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Forearms'],
    equipment: 'Plate',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'wristRoller',
    name: 'Wrist Roller',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Forearms'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'cableCrunch',
    name: 'Cable Crunch',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Core'],
    equipment: 'Cable',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'weightedSitUp',
    name: 'Weighted Sit Up',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'machineCrunch',
    name: 'Machine Crunch',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Core'],
    equipment: 'Machine',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'declineSitUp',
    name: 'Decline Sit Up',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'woodChop',
    name: 'Wood Chop',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'pallofPress',
    name: 'Pallof Press',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Core'],
    equipment: 'Barbell',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'landmineRotation',
    name: 'Landmine Rotation',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'weightedRussianTwist',
    name: 'Weighted Russian Twist',
    aliases: [],
    section: 'weighted',
    group: 'upper',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'backSquat',
    name: 'Back Squat',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Quads'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'squat'
  },
  {
    key: 'frontSquat',
    name: 'Front Squat',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Quads'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'squat'
  },
  {
    key: 'gobletSquat',
    name: 'Goblet Squat',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Quads'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'gobletSquat'
  },
  {
    key: 'bulgarianSplitSquat',
    name: 'Bulgarian Split Squat',
    aliases: ['BSS'],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Quads', 'Glutes', 'Legs'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'bulgarianSplitSquat'
  },
  {
    key: 'legPress',
    name: 'Leg Press',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Quads'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'legPress'
  },
  {
    key: 'hackSquat',
    name: 'Hack Squat',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Quads'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'hackSquat'
  },
  {
    key: 'smithSquat',
    name: 'Smith Squat',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Quads'],
    equipment: 'Smith Machine',
    trackable: true,
    trackingKey: 'hackSquat'
  },
  {
    key: 'sissySquat',
    name: 'Sissy Squat',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Quads'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'squat'
  },
  {
    key: 'stepUp',
    name: 'Step Up',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Quads', 'Glutes'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'walkingLunge',
    name: 'Walking Lunge',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Quads', 'Legs'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'walkingLunge'
  },
  {
    key: 'reverseLunge',
    name: 'Reverse Lunge',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Quads', 'Legs'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'reverseLunge'
  },
  {
    key: 'legExtension',
    name: 'Leg Extension',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Quads'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'legExtension'
  },
  {
    key: 'stiffLegDeadlift',
    name: 'Stiff Leg Deadlift',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Hamstrings'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'stiffLegDeadlift'
  },
  {
    key: 'lyingLegCurl',
    name: 'Lying Leg Curl',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Hamstrings'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'legCurl'
  },
  {
    key: 'seatedLegCurl',
    name: 'Seated Leg Curl',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Hamstrings'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'legCurl'
  },
  {
    key: 'nordicCurl',
    name: 'Nordic Curl',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Hamstrings', 'Legs'],
    equipment: 'Barbell',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'gluteHamRaise',
    name: 'Glute Ham Raise',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Hamstrings'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'hipThrust',
    name: 'Hip Thrust',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Glutes'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'hipThrust'
  },
  {
    key: 'gluteBridge',
    name: 'Glute Bridge',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Glutes'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'gluteBridge'
  },
  {
    key: 'cableKickback',
    name: 'Cable Kickback',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Glutes'],
    equipment: 'Cable',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'frogPump',
    name: 'Frog Pump',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Glutes'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'reverseHyper',
    name: 'Reverse Hyper',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Glutes'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'standingCalfRaise',
    name: 'Standing Calf Raise',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Calves'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'calfRaise'
  },
  {
    key: 'seatedCalfRaise',
    name: 'Seated Calf Raise',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Calves'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'calfRaise'
  },
  {
    key: 'donkeyCalfRaise',
    name: 'Donkey Calf Raise',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Calves'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'calfRaise'
  },
  {
    key: 'legPressCalfRaise',
    name: 'Leg Press Calf Raise',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Calves'],
    equipment: 'Barbell',
    trackable: true,
    trackingKey: 'legPress'
  },
  {
    key: 'singleLegCalfRaise',
    name: 'Single Leg Calf Raise',
    aliases: [],
    section: 'weighted',
    group: 'lower',
    muscleGroups: ['Calves', 'Legs'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'calfRaise'
  },
  {
    key: 'pushUp',
    name: 'Push Up',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pushup'
  },
  {
    key: 'inclinePushUp',
    name: 'Incline Push Up',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pushup'
  },
  {
    key: 'declinePushUp',
    name: 'Decline Push Up',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pushup'
  },
  {
    key: 'diamondPushUp',
    name: 'Diamond Push Up',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pushup'
  },
  {
    key: 'archerPushUp',
    name: 'Archer Push Up',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pushup'
  },
  {
    key: 'pseudoPlanchePushUp',
    name: 'Pseudo Planche Push Up',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pushup'
  },
  {
    key: 'hinduPushUp',
    name: 'Hindu Push Up',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pushup'
  },
  {
    key: 'pikePushUp',
    name: 'Pike Push Up',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pushup'
  },
  {
    key: 'handstandPushUp',
    name: 'Handstand Push Up',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pushup'
  },
  {
    key: 'wallHandstandPushUp',
    name: 'Wall Handstand Push Up',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pushup'
  },
  {
    key: 'ringPushUp',
    name: 'Ring Push Up',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Rings',
    trackable: true,
    trackingKey: 'pushup'
  },
  {
    key: 'ringDip',
    name: 'Ring Dip',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Rings',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'parallelBarDip',
    name: 'Parallel Bar Dip',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'straightBarDip',
    name: 'Straight Bar Dip',
    aliases: [],
    section: 'bodyweight',
    group: 'push',
    muscleGroups: ['Push'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'pullUp',
    name: 'Pull Up',
    aliases: [],
    section: 'bodyweight',
    group: 'pull',
    muscleGroups: ['Pull'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pullup'
  },
  {
    key: 'chinUp',
    name: 'Chin Up',
    aliases: [],
    section: 'bodyweight',
    group: 'pull',
    muscleGroups: ['Pull'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'chinup'
  },
  {
    key: 'neutralGripPullUp',
    name: 'Neutral Grip Pull Up',
    aliases: [],
    section: 'bodyweight',
    group: 'pull',
    muscleGroups: ['Pull'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pullup'
  },
  {
    key: 'archerPullUp',
    name: 'Archer Pull Up',
    aliases: [],
    section: 'bodyweight',
    group: 'pull',
    muscleGroups: ['Pull'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pullup'
  },
  {
    key: 'typewriterPullUp',
    name: 'Typewriter Pull Up',
    aliases: [],
    section: 'bodyweight',
    group: 'pull',
    muscleGroups: ['Pull'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pullup'
  },
  {
    key: 'commandoPullUp',
    name: 'Commando Pull Up',
    aliases: [],
    section: 'bodyweight',
    group: 'pull',
    muscleGroups: ['Pull'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pullup'
  },
  {
    key: 'australianPullUp',
    name: 'Australian Pull Up',
    aliases: [],
    section: 'bodyweight',
    group: 'pull',
    muscleGroups: ['Pull'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pullup'
  },
  {
    key: 'muscleUp',
    name: 'Muscle Up',
    aliases: [],
    section: 'bodyweight',
    group: 'pull',
    muscleGroups: ['Pull'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'chestToBarPullUp',
    name: 'Chest To Bar Pull Up',
    aliases: [],
    section: 'bodyweight',
    group: 'pull',
    muscleGroups: ['Pull'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'pullup'
  },
  {
    key: 'frontLeverPull',
    name: 'Front Lever Pull',
    aliases: [],
    section: 'bodyweight',
    group: 'pull',
    muscleGroups: ['Pull'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'frontLeverRaise',
    name: 'Front Lever Raise',
    aliases: [],
    section: 'bodyweight',
    group: 'pull',
    muscleGroups: ['Pull'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'skinTheCat',
    name: 'Skin The Cat',
    aliases: [],
    section: 'bodyweight',
    group: 'pull',
    muscleGroups: ['Pull'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'airSquat',
    name: 'Air Squat',
    aliases: [],
    section: 'bodyweight',
    group: 'legs',
    muscleGroups: ['Legs'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'squat'
  },
  {
    key: 'jumpSquat',
    name: 'Jump Squat',
    aliases: [],
    section: 'bodyweight',
    group: 'legs',
    muscleGroups: ['Legs'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'jumpSquat'
  },
  {
    key: 'shrimpSquat',
    name: 'Shrimp Squat',
    aliases: [],
    section: 'bodyweight',
    group: 'legs',
    muscleGroups: ['Legs'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'squat'
  },
  {
    key: 'pistolSquat',
    name: 'Pistol Squat',
    aliases: [],
    section: 'bodyweight',
    group: 'legs',
    muscleGroups: ['Legs'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'squat'
  },
  {
    key: 'assistedPistolSquat',
    name: 'Assisted Pistol Squat',
    aliases: [],
    section: 'bodyweight',
    group: 'legs',
    muscleGroups: ['Legs'],
    equipment: 'Machine',
    trackable: true,
    trackingKey: 'squat'
  },
  {
    key: 'cossackSquat',
    name: 'Cossack Squat',
    aliases: [],
    section: 'bodyweight',
    group: 'legs',
    muscleGroups: ['Legs'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'squat'
  },
  {
    key: 'singleLegGluteBridge',
    name: 'Single Leg Glute Bridge',
    aliases: [],
    section: 'bodyweight',
    group: 'legs',
    muscleGroups: ['Legs'],
    equipment: 'Bodyweight',
    trackable: true,
    trackingKey: 'gluteBridge'
  },
  {
    key: 'boxJump',
    name: 'Box Jump',
    aliases: [],
    section: 'bodyweight',
    group: 'legs',
    muscleGroups: ['Legs'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'wallSit',
    name: 'Wall Sit',
    aliases: [],
    section: 'bodyweight',
    group: 'legs',
    muscleGroups: ['Legs'],
    equipment: 'Bodyweight',
    trackable: true,
    isHold: true,
    trackingKey: 'wallSit'
  },
  {
    key: 'plank',
    name: 'Plank',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: true,
    isHold: true,
    trackingKey: 'plank'
  },
  {
    key: 'sidePlank',
    name: 'Side Plank',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: true,
    isHold: true,
    trackingKey: 'sidePlank'
  },
  {
    key: 'hollowHold',
    name: 'Hollow Hold',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: true,
    isHold: true,
    trackingKey: 'hollowHold'
  },
  {
    key: 'deadBug',
    name: 'Dead Bug',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: true,
    isHold: true,
    trackingKey: 'deadBug'
  },
  {
    key: 'birdDog',
    name: 'Bird Dog',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: true,
    isHold: true,
    trackingKey: 'birdDog'
  },
  {
    key: 'legRaise',
    name: 'Leg Raise',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'hangingLegRaise',
    name: 'Hanging Leg Raise',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'kneeRaise',
    name: 'Knee Raise',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'toesToBar',
    name: 'Toes To Bar',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'lSit',
    name: 'L Sit',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: true,
    isHold: true,
    trackingKey: 'lSit'
  },
  {
    key: 'dragonFlag',
    name: 'Dragon Flag',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: true,
    isHold: true,
    trackingKey: 'dragonFlag'
  },
  {
    key: 'bicycleCrunch',
    name: 'Bicycle Crunch',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'reverseCrunch',
    name: 'Reverse Crunch',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'vUp',
    name: 'V Up',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'russianTwist',
    name: 'Russian Twist',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'mountainClimber',
    name: 'Mountain Climber',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
  {
    key: 'abRollout',
    name: 'Ab Rollout',
    aliases: [],
    section: 'bodyweight',
    group: 'core',
    muscleGroups: ['Core'],
    equipment: 'Bodyweight',
    trackable: false,
    trackingKey: null
  },
];

// ---------------------------------------------------------------------
// Helpers used by the StartScreen exercise picker
// ---------------------------------------------------------------------

// Case/space/punctuation-insensitive contains check.
function norm(s) {
  return (s || '').toLowerCase().trim();
}

export function searchExerciseLibrary(query) {
  const q = norm(query);
  if (!q) return EXERCISE_LIBRARY;
  return EXERCISE_LIBRARY.filter((ex) => {
    if (norm(ex.name).includes(q)) return true;
    if (ex.aliases.some((a) => norm(a).includes(q))) return true;
    if (ex.muscleGroups.some((m) => norm(m).includes(q))) return true;
    if (norm(ex.equipment).includes(q)) return true;
    return false;
  });
}

export function getMuscleGroupsFor(section, group) {
  const groups = [];
  for (const ex of EXERCISE_LIBRARY) {
    if (ex.section !== section || ex.group !== group) continue;
    for (const mg of ex.muscleGroups) {
      if (!groups.includes(mg)) groups.push(mg);
    }
  }
  return groups;
}

export function getExercisesFor(section, group, muscleGroup) {
  return EXERCISE_LIBRARY.filter(
    (ex) => ex.section === section && ex.group === group && ex.muscleGroups.includes(muscleGroup)
  );
}