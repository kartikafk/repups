// Research-sourced starting values only. A licensed physiotherapist must review
// them before any clinical interpretation; tracking errors are not findings.
const source = "AAOS Neutral Zero Method / sports biomechanics starting reference";
export const romCeilings = { kneeFlexionMaxDeg:{value:135,source}, elbowFlexionMaxDeg:{value:150,source}, shoulderFlexionMaxDeg:{value:180,source}, shoulderAbductionMaxDeg:{value:180,source}, ankleRomDeg:{value:[0,45],source}, lumbarFlexionMaxDeg:{value:75,source}, cervicalFlexionRangeDeg:{value:[70,90],source} };
export const formWorkingRanges = { kneeValgusDeg:{value:{male:[3,8],female:[7,13]},source}, kneeValgusFlagThresholdDeg:{value:10,source}, pelvicTiltStandingDeg:{value:{male:[4,7],female:[7,10]},source}, thoracicKyphosisDeg:{value:[20,40],source}, lumbarLordosisDeg:{value:[40,60],source}, squatDepthKneeFlexionDeg:{value:{parallel:[70,90],deep:">90"},source}, sideAsymmetryToleranceDeg:{value:[10,15],source} };
