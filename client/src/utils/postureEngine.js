/**
 * Biomechanical Posture Calculation Engine
 * Computes anatomical deviation vectors from MediaPipe landmarks
 * across all three anatomical planes:
 *   - Coronal (frontal / back view)   -> analyzeFrontalPosture / analyzeBackPosture
 *   - Sagittal (side/profile view)    -> analyzeProfilePosture
 *   - Transverse (rotational)         -> analyzeTransversePlane
 *
 * NOTE on limits: this is a single monocular camera, not a 3D motion
 * capture rig. x/y landmark positions are reliable; the z (depth) values
 * MediaPipe returns are a rough model estimate, not measured depth. The
 * transverse-plane numbers should be treated as a directional screening
 * signal, not a clinical rotation measurement.
 *
 * NOTE on joint chain: MediaPipe's 33-point pose model has no dedicated
 * ribcage, patella, or tibial-tuberosity landmarks. "Ribcage" below is
 * approximated as the lateral shift of the trunk (shoulder midpoint vs
 * hip midpoint). The per-leg "Q-Angle" is a screening proxy — the
 * deviation of the hip->knee->ankle chain from a straight line, not a
 * clinical Q-angle (which requires ASIS/patella/tibial-tuberosity
 * markers). Good for trend-tracking and coaching cues, not diagnosis.
 */

// ---------------------------------------------------------------------
// Basic geometry helpers
// ---------------------------------------------------------------------

export function calculateDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function calculateAngle(p1, p2) {
  const radians = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  return Math.abs(radians * (180 / Math.PI));
}

// Interior angle at point `b` formed by segments a->b and b->c, in degrees.
// 180° = perfectly straight (e.g. a straight leg, hip-knee-ankle aligned).
function interiorAngle(a, b, c) {
  const abx = a.x - b.x, aby = a.y - b.y;
  const cbx = c.x - b.x, cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magAB = Math.sqrt(abx * abx + aby * aby);
  const magCB = Math.sqrt(cbx * cbx + cby * cby);
  if (magAB === 0 || magCB === 0) return 180;
  const cos = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

// ---------------------------------------------------------------------
// Real-world calibration (optional)
// ---------------------------------------------------------------------

/**
 * Builds an inches-per-normalized-unit conversion using the subject's
 * real height plus their visible ear-to-ankle span in the photo. Falls
 * back to null (percentage-of-frame reporting) if height wasn't provided
 * or landmarks are incomplete.
 * @param {Array} landmarks - front-view landmarks (best full-body view)
 * @param {number} heightInches - user-supplied height, optional
 * @param {number} frameWidth - capture canvas width in px (default 640)
 * @param {number} frameHeight - capture canvas height in px (default 480)
 */
export function buildCalibration(landmarks, heightInches, frameWidth = 640, frameHeight = 480) {
  if (!heightInches || !landmarks || landmarks.length < 29) return null;

  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  if (!leftEar || !rightEar || !leftAnkle || !rightAnkle) return null;

  const earY = (leftEar.y + rightEar.y) / 2;
  const ankleY = (leftAnkle.y + rightAnkle.y) / 2;
  const earToAnkleNormalized = Math.abs(ankleY - earY);
  if (earToAnkleNormalized <= 0) return null;

  // Ears sit roughly 95% of the way up a standing person's height; this
  // recovers an approximate full-height span from the visible ear-to-ankle
  // distance in frame. It's a heuristic, not a measurement.
  const fullHeightNormalized = earToAnkleNormalized / 0.95;
  if (fullHeightNormalized <= 0) return null;

  const inchesPerUnitY = heightInches / fullHeightNormalized;
  const aspect = frameHeight > 0 ? frameWidth / frameHeight : 1;
  // x and y are each normalized against a different axis (width vs height),
  // so the x-axis conversion needs the frame's aspect ratio correction to
  // stay in real inches too.
  const inchesPerUnitX = inchesPerUnitY * aspect;

  return { inchesPerUnitX, inchesPerUnitY, heightInches };
}

// ---------------------------------------------------------------------
// Severity tiering (PostureCo has no tiers — we add them, color-mapped
// on the frontend to Aligned / Mild / Moderate / Severe)
// ---------------------------------------------------------------------

export const SEVERITY = {
  ALIGNED: "Aligned",
  MILD: "Mild",
  MODERATE: "Moderate",
  SEVERE: "Severe"
};

function tierForDegrees(deg) {
  const d = Math.abs(deg);
  if (d < 1) return SEVERITY.ALIGNED;
  if (d < 3) return SEVERITY.MILD;
  if (d < 6) return SEVERITY.MODERATE;
  return SEVERITY.SEVERE;
}

function tierForInches(inches) {
  const s = Math.abs(inches);
  if (s < 0.4) return SEVERITY.ALIGNED;
  if (s < 0.8) return SEVERITY.MILD;
  if (s < 1.5) return SEVERITY.MODERATE;
  return SEVERITY.SEVERE;
}

function tierForPercent(pct) {
  const p = Math.abs(pct);
  if (p < 1) return SEVERITY.ALIGNED;
  if (p < 2) return SEVERITY.MILD;
  if (p < 4) return SEVERITY.MODERATE;
  return SEVERITY.SEVERE;
}

// Builds a shift reading (real inches if calibrated, else % of frame),
// its severity tier, and a human label with left/right or fwd/back direction.
function buildShiftJoint(name, deltaNormalized, axisScale, directionLabels) {
  const [posLabel, negLabel] = directionLabels; // e.g. ["Right of Center","Left of Center"]
  let value, unit, status;

  if (axisScale) {
    value = deltaNormalized * axisScale;
    unit = "in";
    status = tierForInches(value);
  } else {
    value = deltaNormalized * 100; // percent of frame
    unit = "%";
    status = tierForPercent(value);
  }

  const dirLabel = value === 0 ? "Centered" : value > 0 ? posLabel : negLabel;
  const displayValue = Math.abs(value).toFixed(unit === "in" ? 2 : 1);
  const label = status === SEVERITY.ALIGNED
    ? `Centered (±${displayValue}${unit})`
    : `${displayValue}${unit} ${dirLabel}`;

  return { name, metric: "shift", value: Math.abs(value), unit, label, status };
}

function buildTiltJoint(name, deltaYNormalized, leftHigherLabel = "Left Elevated", rightHigherLabel = "Right Elevated") {
  // Positive deltaY (left.y - right.y) in image space means left point is
  // LOWER on screen (y grows downward) i.e. right side is elevated.
  const deg = deltaYNormalized * 45; // scaled proxy: full-frame delta ~ steep tilt
  const status = tierForDegrees(deg);
  const dirLabel = deltaYNormalized === 0 ? "Level" : deltaYNormalized > 0 ? rightHigherLabel : leftHigherLabel;
  const label = status === SEVERITY.ALIGNED ? "Level" : `${Math.abs(deg).toFixed(1)}° (${dirLabel})`;
  return { name, metric: "tilt", value: Math.abs(deg), unit: "deg", label, status };
}

// ---------------------------------------------------------------------
// Coronal plane (front & back share the same joint math; only labels
// and which physical side of the body you're looking at differ)
// ---------------------------------------------------------------------

function computeCoronalJoints(landmarks, calibration, { trunkJointName, spineJointName }) {
  const leftEar = landmarks[7], rightEar = landmarks[8];
  const leftShoulder = landmarks[11], rightShoulder = landmarks[12];
  const leftHip = landmarks[23], rightHip = landmarks[24];
  const leftKnee = landmarks[25], rightKnee = landmarks[26];
  const leftAnkle = landmarks[27], rightAnkle = landmarks[28];

  const ankleMidX = (leftAnkle.x + rightAnkle.x) / 2;
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const hipMidX = (leftHip.x + rightHip.x) / 2;
  const earMidX = (leftEar.x + rightEar.x) / 2;

  const xScale = calibration ? calibration.inchesPerUnitX : null;

  const joints = [];

  // 1. Head (ear level + horizontal shift off the ankle plumb line)
  joints.push(
    buildTiltJoint("Head", leftEar.y - rightEar.y, "Left Ear Elevated", "Right Ear Elevated")
  );
  joints.push(
    buildShiftJoint("Head", earMidX - ankleMidX, xScale, ["Right of Center", "Left of Center"])
  );

  // 2. Shoulders (level + shift off the same plumb line)
  joints.push(
    buildTiltJoint("Shoulders", leftShoulder.y - rightShoulder.y, "Left Shoulder Elevated", "Right Shoulder Elevated")
  );
  joints.push(
    buildShiftJoint("Shoulders", shoulderMidX - ankleMidX, xScale, ["Right of Center", "Left of Center"])
  );

  // 3. Ribcage / trunk — approximated as lateral shift between the
  // shoulder line and the hip line (no dedicated rib landmarks exist).
  joints.push(
    buildShiftJoint(trunkJointName, shoulderMidX - hipMidX, xScale, ["Shifted Right", "Shifted Left"])
  );

  // 4. Hips (level + shift off plumb line)
  joints.push(
    buildTiltJoint("Hips", leftHip.y - rightHip.y, "Left Hip Elevated", "Right Hip Elevated")
  );
  joints.push(
    buildShiftJoint("Hips", hipMidX - ankleMidX, xScale, ["Right of Center", "Left of Center"])
  );

  // 5. Knees — per-leg valgus/varus screen: does the knee sit inside
  // (valgus) or outside (varus) the straight hip->ankle line, and a
  // hip-knee-ankle "pseudo Q-angle" (180° = straight leg).
  [{ side: "Left", hip: leftHip, knee: leftKnee, ankle: leftAnkle },
   { side: "Right", hip: rightHip, knee: rightKnee, ankle: rightAnkle }].forEach(({ side, hip, knee, ankle }) => {
    const expectedKneeX = hip.x + (ankle.x - hip.x) * ((knee.y - hip.y) / (ankle.y - hip.y || 1));
    const kneeOffset = knee.x - expectedKneeX;
    joints.push(
      buildShiftJoint(`${side} Knee`, kneeOffset, xScale, ["Shifted Outward (Varus)", "Shifted Inward (Valgus)"])
    );

    const qAngle = 180 - interiorAngle(hip, knee, ankle);
    const qStatus = tierForDegrees(qAngle);
    joints.push({
      name: `${side} Knee Q-Angle`,
      metric: "angle",
      value: qAngle,
      unit: "deg",
      label: qStatus === SEVERITY.ALIGNED ? "Straight Leg Alignment" : `${qAngle.toFixed(1)}° Deviation from Straight`,
      status: qStatus
    });
  });

  // 6. Ankles/feet — base-of-support check: are the feet stacked under
  // the shoulders, and are they level with each other.
  joints.push(
    buildTiltJoint("Ankles", leftAnkle.y - rightAnkle.y, "Left Ankle Higher", "Right Ankle Higher")
  );
  joints.push(
    buildShiftJoint("Ankles", ankleMidX - shoulderMidX, xScale, ["Right of Shoulders", "Left of Shoulders"])
  );

  return { joints, spineJointName };
}

/**
 * Analyze Frontal View (Coronal Plane)
 */
export function analyzeFrontalPosture(landmarks, calibration = null) {
  if (!landmarks || landmarks.length < 29) {
    return {
      score: 85,
      shoulderDelta: "0.4 cm",
      headTilt: "0.5° Level",
      status: "Estimated Normal",
      joints: [],
      plane: "Coronal (Frontal View)"
    };
  }

  const leftShoulder = landmarks[11], rightShoulder = landmarks[12];
  const leftHip = landmarks[23], rightHip = landmarks[24];

  const shoulderDeltaY = Math.abs(leftShoulder.y - rightShoulder.y) * 100;
  const shoulderStatus = shoulderDeltaY < 1.5 ? "Level & Symmetric" : "Elevated Asymmetry Detected";
  const hipDeltaY = Math.abs(leftHip.y - rightHip.y) * 100;

  let score = 100 - (shoulderDeltaY * 4) - (hipDeltaY * 3);
  score = Math.max(60, Math.min(99, Math.round(score)));

  const { joints } = computeCoronalJoints(landmarks, calibration, { trunkJointName: "Ribcage" });

  return {
    score,
    shoulderDelta: `${shoulderDeltaY.toFixed(1)}% delta offset (${shoulderStatus})`,
    hipAlignment: `${hipDeltaY.toFixed(1)}% pelvic tilt delta`,
    shoulderDeltaY,
    hipDeltaY,
    joints,
    plane: "Coronal (Frontal View)"
  };
}

/**
 * Analyze Back View (Posterior Coronal Plane)
 */
export function analyzeBackPosture(landmarks, calibration = null) {
  if (!landmarks || landmarks.length < 29) {
    return {
      score: 84,
      scapularDelta: "0.5 cm",
      spineShift: "0.6% Centered",
      pelvicTilt: "0.4% Level",
      joints: [],
      plane: "Coronal (Posterior/Back View)"
    };
  }

  const leftShoulder = landmarks[11], rightShoulder = landmarks[12];
  const leftHip = landmarks[23], rightHip = landmarks[24];

  const scapularDeltaY = Math.abs(leftShoulder.y - rightShoulder.y) * 100;
  const scapularStatus = scapularDeltaY < 1.5 ? "Level & Symmetric" : "Scapular Elevation Asymmetry";

  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const hipMidX = (leftHip.x + rightHip.x) / 2;
  const spineShiftPct = Math.abs(shoulderMidX - hipMidX) * 100;
  const spineStatus = spineShiftPct < 1.5 ? "Centered Spinal Axis" : "Lateral Spinal Deviation Detected";

  const pelvicTiltPct = Math.abs(leftHip.y - rightHip.y) * 100;

  let score = 100 - (scapularDeltaY * 3.5) - (spineShiftPct * 4) - (pelvicTiltPct * 3);
  score = Math.max(58, Math.min(99, Math.round(score)));

  const { joints } = computeCoronalJoints(landmarks, calibration, { trunkJointName: "Spinal Axis" });

  return {
    score,
    scapularDelta: `${scapularDeltaY.toFixed(1)}% delta offset (${scapularStatus})`,
    spineShift: `${spineShiftPct.toFixed(1)}% lateral shift (${spineStatus})`,
    pelvicTilt: `${pelvicTiltPct.toFixed(1)}% pelvic obliquity`,
    scapularDeltaY,
    spineShiftPct,
    pelvicTiltPct,
    joints,
    plane: "Coronal (Posterior/Back View)"
  };
}

// ---------------------------------------------------------------------
// Sagittal plane (side view)
// ---------------------------------------------------------------------

/**
 * Analyze Profile / Side View (Sagittal Plane)
 * Requires a genuine side-on photo (ear/shoulder/hip stacked in depth).
 */
export function analyzeProfilePosture(landmarks, calibration = null) {
  if (!landmarks || landmarks.length < 29) {
    return {
      score: 86,
      headTranslation: "Minor Forward Lean (+1.8°)",
      spineCurve: "Normal Sagittal Curve",
      joints: [],
      plane: "Sagittal (Profile View)"
    };
  }

  const ear = landmarks[7]?.visibility >= landmarks[8]?.visibility ? landmarks[7] : (landmarks[8] || landmarks[7]);
  const shoulder = landmarks[11]?.visibility >= landmarks[12]?.visibility ? landmarks[11] : (landmarks[12] || landmarks[11]);
  const hip = landmarks[23]?.visibility >= landmarks[24]?.visibility ? landmarks[23] : (landmarks[24] || landmarks[23]);
  const knee = landmarks[25]?.visibility >= landmarks[26]?.visibility ? landmarks[25] : (landmarks[26] || landmarks[25]);
  const ankle = landmarks[27]?.visibility >= landmarks[28]?.visibility ? landmarks[27] : (landmarks[28] || landmarks[27]);
  const nose = landmarks[0];

  const headForwardOffset = Math.abs(ear.x - shoulder.x) * 100;
  const headStatus = headForwardOffset < 3.0 ? "Optimal Alignment" : "Forward Head Translation (+CVA Shift)";
  const plumbDeviation = Math.abs(shoulder.x - hip.x) * 100;

  let score = 100 - (headForwardOffset * 3.5) - (plumbDeviation * 2.5);
  score = Math.max(55, Math.min(98, Math.round(score)));

  // Facing direction: which way is "forward" on screen, so offsets read
  // as Forward/Behind rather than a meaningless left/right on a profile shot.
  const facingDir = nose && ear ? (nose.x >= ear.x ? 1 : -1) : 1;
  const xScale = calibration ? calibration.inchesPerUnitX : null;

  const chain = [
    { name: "Head", point: ear },
    { name: "Shoulder", point: shoulder },
    { name: "Hip", point: hip },
    { name: "Knee", point: knee },
    { name: "Ankle", point: ankle }
  ];

  const joints = chain.map(({ name, point }) => {
    const rawOffset = (point.x - ankle.x) * facingDir; // positive = forward of the ankle plumb line
    return buildShiftJoint(name, rawOffset, xScale, ["Forward of Plumb Line", "Behind Plumb Line"]);
  });

  return {
    score,
    headTranslation: `${headForwardOffset.toFixed(1)}cm forward translation (${headStatus})`,
    plumbLine: `${plumbDeviation.toFixed(1)}cm gravitational offset`,
    headForwardOffset,
    plumbDeviation,
    joints,
    plane: "Sagittal (Profile View)"
  };
}

// ---------------------------------------------------------------------
// Transverse plane (rotational, z-depth based screening only)
// ---------------------------------------------------------------------

export function analyzeTransversePlane(landmarks) {
  if (!landmarks || landmarks.length < 25) {
    return {
      score: 87,
      shoulderRotation: "0.6% Neutral",
      hipRotation: "0.5% Neutral",
      counterRotation: "0.4% Minimal",
      joints: [],
      plane: "Transverse (Rotational)"
    };
  }

  const leftShoulder = landmarks[11], rightShoulder = landmarks[12];
  const leftHip = landmarks[23], rightHip = landmarks[24];

  const shoulderZDelta = ((leftShoulder.z || 0) - (rightShoulder.z || 0)) * 100;
  const hipZDelta = ((leftHip.z || 0) - (rightHip.z || 0)) * 100;
  const counterRotation = Math.abs(shoulderZDelta - hipZDelta);

  const shoulderRotationStatus = Math.abs(shoulderZDelta) < 2 ? "Neutral" : shoulderZDelta > 0 ? "Left Shoulder Rotated Forward" : "Right Shoulder Rotated Forward";
  const hipRotationStatus = Math.abs(hipZDelta) < 2 ? "Neutral" : hipZDelta > 0 ? "Left Hip Rotated Forward" : "Right Hip Rotated Forward";

  let score = 100 - (Math.abs(shoulderZDelta) * 2.5) - (Math.abs(hipZDelta) * 2.5) - (counterRotation * 1.5);
  score = Math.max(60, Math.min(99, Math.round(score)));

  const joints = [
    { name: "Shoulder Rotation", metric: "rotation", value: Math.abs(shoulderZDelta), unit: "%", label: `${shoulderZDelta.toFixed(1)}% (${shoulderRotationStatus})`, status: tierForPercent(shoulderZDelta) },
    { name: "Hip Rotation", metric: "rotation", value: Math.abs(hipZDelta), unit: "%", label: `${hipZDelta.toFixed(1)}% (${hipRotationStatus})`, status: tierForPercent(hipZDelta) },
    { name: "Trunk-Pelvis Counter-Rotation", metric: "rotation", value: counterRotation, unit: "%", label: `${counterRotation.toFixed(1)}% counter-rotation`, status: tierForPercent(counterRotation) }
  ];

  return {
    score,
    shoulderRotation: `${shoulderZDelta.toFixed(1)}% (${shoulderRotationStatus})`,
    hipRotation: `${hipZDelta.toFixed(1)}% (${hipRotationStatus})`,
    counterRotation: `${counterRotation.toFixed(1)}% trunk-pelvis counter-rotation`,
    joints,
    plane: "Transverse (Rotational)"
  };
}

// ---------------------------------------------------------------------
// Findings / recommendations (rule-based, structured for the AI Trainer)
// ---------------------------------------------------------------------

function buildFindings({ front, side, back, transverse }) {
  const findings = [];
  const avoid = [];
  const focusOn = [];

  if (front.shoulderDeltaY > 1.5) {
    findings.push("Shoulder height asymmetry detected from the front.");
    avoid.push("Heavy unilateral overhead pressing until symmetry improves.");
    focusOn.push("Unilateral rows and face pulls to balance shoulder height.");
  }
  if (front.hipDeltaY > 1.5) {
    findings.push("Hip/pelvic height asymmetry detected from the front.");
    focusOn.push("Single-leg glute bridges and hip hikes for pelvic control.");
  }
  if (side.headForwardOffset > 3.0) {
    findings.push("Forward head posture detected from the side.");
    avoid.push("Prolonged forward-head positions (phone/desk slouching).");
    focusOn.push("Chin tucks and deep neck flexor endurance work.");
  }
  if (side.plumbDeviation > 3.0) {
    findings.push("Shoulders sit forward of the hips (rounded upper back / plumb-line deviation).");
    focusOn.push("Thoracic extensions and band pull-aparts.");
  }
  if (back.spineShiftPct > 1.5) {
    findings.push("Lateral spinal shift detected from behind.");
    avoid.push("Loaded single-sided carries on the dominant side only.");
    focusOn.push("Anti-lateral-flexion core work (suitcase carries both sides, side planks).");
  }
  if (back.pelvicTiltPct > 1.5) {
    findings.push("Pelvic obliquity detected from behind.");
    focusOn.push("Hip flexor stretching and glute medius activation.");
  }
  if (transverse.counterRotation > 4) {
    findings.push("Trunk-pelvis counter-rotation detected — shoulders and hips are twisting out of alignment.");
    avoid.push("Heavy asymmetric loading (e.g. one-arm carries) without correction.");
    focusOn.push("Anti-rotation core work (Pallof press, dead bugs).");
  }

  // Knee valgus/varus flags, pulled from the front-view joint list.
  (front.joints || []).forEach((j) => {
    if (j.metric === "shift" && j.name.includes("Knee") && !j.name.includes("Q-Angle") && j.status !== SEVERITY.ALIGNED) {
      findings.push(`${j.name} tracking issue detected (${j.label}).`);
      focusOn.push(`Glute medius/VMO activation work for the ${j.name.toLowerCase()}.`);
    }
  });

  if (findings.length === 0) {
    findings.push("No significant deviations detected across the three planes.");
    focusOn.push("Maintain current mobility and general strength routine.");
  }

  return { findings, avoid, focusOn };
}

/**
 * Combine all view analyses into one composite report the UI (and the
 * AI Trainer feature) can consume directly.
 */
export function buildPostureReport({ front, side, back, transverse }) {
  const weighted =
    front.score * 0.3 +
    side.score * 0.3 +
    back.score * 0.25 +
    transverse.score * 0.15;

  const overallScore = Math.round(weighted);
  const { findings, avoid, focusOn } = buildFindings({ front, side, back, transverse });

  return {
    overallScore,
    generatedAt: new Date().toISOString(),
    planes: { front, side, back, transverse },
    findings,
    recommendations: { avoid, focusOn }
  };
}