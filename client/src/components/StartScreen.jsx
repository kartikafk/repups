import { useMemo, useState } from 'react';
import {
  EXERCISE_LIBRARY,
  searchExerciseLibrary,
  getMuscleGroupsFor,
  getExercisesFor,
  getCameraHint
} from '../exercises';

// Accordion structure for each tab. Order here = display order.
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

export default function StartScreen({ exercise, setExercise, facingMode, setFacingMode, voiceOn, setVoiceOn, onStart }) {
  const [note, setNote] = useState(
    'Prop your phone up ~2m away, full body in frame.\nPose model loads on first start (few seconds).'
  );

  const [search, setSearch] = useState('');
  const [exerciseType, setExerciseType] = useState('weighted'); // 'weighted' | 'bodyweight'

  // Only one accordion (group -> muscle group) open at a time. We track
  // it as a single "open key" string so switching sections auto-closes
  // whatever was open before, per spec.
 const [openMainSection, setOpenMainSection] = useState(null);
const [openMuscleGroup, setOpenMuscleGroup] = useState(null);// e.g. "upper" or "upper:Chest"

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    return searchExerciseLibrary(search);
  }, [search]);

  const activeSections = exerciseType === 'weighted' ? WEIGHTED_SECTIONS : BODYWEIGHT_SECTIONS;
  const selectedExerciseMeta = useMemo(
    () => EXERCISE_LIBRARY.find((ex) => ex.key === exercise || ex.trackingKey === exercise),
    [exercise]
  );

  const formatCameraErrorDetail = (message = '') => {
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
  };

  const handleStart = async () => {
    setNote('Loading pose model…');
    try {
      await onStart();
    } catch (err) {
      const message = err?.message || 'Unknown error';
      const detail = formatCameraErrorDetail(message);
      setNote('Camera or model failed to load: ' + detail);
    }
  };

  const handlePickExercise = (ex) => {
    // Unchanged contract: selecting an exercise calls setExercise(key)
    // exactly as before. If the exercise has a tuned tracking config we
    // pass that key (trackingKey) so the pose tracker's EXERCISES/
    // HOLD_EXERCISES lookup resolves; otherwise we pass its own key so
    // the UI still reflects the pick, and the Start button is disabled
    // below.
    setExercise(ex.trackable ? ex.trackingKey : ex.key);
  };

  // The actual cause of the list "jumping up" on pick: tapping a <button>
  // gives it focus, and browsers (especially on mobile) auto-scroll a
  // newly-focused element into view. That scroll happens on pointerdown,
  // before onClick ever runs — so blurring inside onClick was always too
  // late. Calling preventDefault() on pointerdown/mousedown stops the
  // button from taking focus at all, which stops the auto-scroll, while
  // onClick still fires normally afterward.
  const preventFocusSteal = (e) => {
    e.preventDefault();
  };

  const isSelected = (ex) => exercise === ex.key || exercise === ex.trackingKey;

  const canStart = !selectedExerciseMeta || selectedExerciseMeta.trackable;

  const toggleMainSection = (id) => {
  setOpenMainSection((prev) => {
    const next = prev === id ? null : id;

    // Whenever a different main section is opened,
    // close any open muscle group.
    setOpenMuscleGroup(null);

    return next;
  });
};

const toggleMuscleGroup = (key) => {
  setOpenMuscleGroup((prev) => (prev === key ? null : key));
};

  return (
    <div className="start">
      <div className="brand">FORMCOACH · LIVE VISION</div>
      <div className="h1">
        Track every rep.
        <br />
        <span>Fix form in real time.</span>
      </div>

      <div className="field-label">Exercise</div>

      <div className="ex-picker">
        <div className="ex-search-wrap">
          <span className="ex-search-icon">⌕</span>
          <input
            className="ex-search"
            type="text"
            placeholder="Search name, muscle, or equipment…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="ex-search-clear" onMouseDown={preventFocusSteal} onClick={() => setSearch('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        {!searchResults && (
          <div className="ex-type-tabs">
            <button
              type="button"
              className={`ex-type-tab ${exerciseType === 'weighted' ? 'active' : ''}`}
              onMouseDown={preventFocusSteal}
              onClick={() => {
                setExerciseType('weighted');
                setOpenSection(null);
              }}
            >
              🏋️ Weighted
            </button>
            <button
              type="button"
              className={`ex-type-tab ${exerciseType === 'bodyweight' ? 'active' : ''}`}
              onMouseDown={preventFocusSteal}
              onClick={() => {
                setExerciseType('bodyweight');
                setOpenSection(null);
              }}
            >
              🤸 Bodyweight
            </button>
          </div>
        )}

        <div className="ex-list-area">
          {searchResults ? (
            <SearchResults results={searchResults} isSelected={isSelected} onPick={handlePickExercise} />
          ) : (
            <div className="ex-accordion">
              {activeSections.map((section) => (
                <SectionAccordion
    key={section.id}
    section={section}
    exerciseType={exerciseType}

    openMainSection={openMainSection}
    toggleMainSection={toggleMainSection}

    openMuscleGroup={openMuscleGroup}
    toggleMuscleGroup={toggleMuscleGroup}

    isSelected={isSelected}
    onPick={handlePickExercise}
/>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedExerciseMeta && !selectedExerciseMeta.trackable && (
        <div className="ex-track-warning">
          Camera tracking isn't tuned for {selectedExerciseMeta.name} yet — pick a tracked exercise to start a set.
        </div>
      )}

      {selectedExerciseMeta && selectedExerciseMeta.trackable && (
        <div className="ex-camera-hint">
          📐 {getCameraHint(selectedExerciseMeta.trackingKey)}
          {selectedExerciseMeta.isHold && (
            <span className="ex-camera-hint-badge"> · Hold-timer exercise</span>
          )}
        </div>
      )}

      <div className="field-label">Camera</div>
      <div className="row3">
        <div className={`pill ${facingMode === 'user' ? 'active' : ''}`} onClick={() => setFacingMode('user')}>
          Front
        </div>
        <div className={`pill ${facingMode === 'environment' ? 'active' : ''}`} onClick={() => setFacingMode('environment')}>
          Back
        </div>
      </div>

      <div className="toggle-row">
        <div>
          <div className="t">Voice coaching</div>
          <div className="s">Spoken cues during your set</div>
        </div>
        <div className={`switch ${voiceOn ? 'on' : ''}`} onClick={() => setVoiceOn(!voiceOn)} />
      </div>

      <div className="spacer" />
      <button className="cta" onClick={handleStart} disabled={!canStart}>
        Start camera & begin set
      </button>
      <div className="subnote">
        {note.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            <br />
          </span>
        ))}
      </div>
    </div>
  );
}

function SearchResults({ results, isSelected, onPick }) {
  if (results.length === 0) {
    return <div className="ex-empty">No exercises match your search.</div>;
  }
  return (
    <div className="ex-grid">
      {results.map((ex) => (
        <ExerciseChip key={ex.key} ex={ex} selected={isSelected(ex)} onPick={onPick} />
      ))}
    </div>
  );
}

function SectionAccordion({
    section,
    exerciseType,

    openMainSection,
    toggleMainSection,

    openMuscleGroup,
    toggleMuscleGroup,

    isSelected,
    onPick
}) {
  const isOpen = openMainSection === section.id;

  // Count total exercises directly under this top-level section (Upper/Lower/Push/Pull/Legs/Core)
  const totalCount = useMemo(() => {
    return section.muscleGroups.reduce(
      (sum, mg) => sum + getExercisesFor(exerciseType, section.id, mg).length,
      0
    );
  }, [section, exerciseType]);

  return (
    <div className={`acc-section ${isOpen ? 'open' : ''}`}>
      <button
    type="button"
    className="acc-section-header"
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => toggleMainSection(section.id)}
>  <span className="acc-title">{section.label}</span>
        <span className="acc-count">{totalCount}</span>
        <span className="acc-chevron">⌄</span>
      </button>
      <div className="acc-section-body" style={{ maxHeight: isOpen ? '2000px' : '0px' }}>
        <div className="acc-muscle-list">
          {section.muscleGroups.map((mg) => (
            <MuscleGroupAccordion
    key={mg}
    muscleGroup={mg}
    sectionId={section.id}
    exerciseType={exerciseType}

    openMuscleGroup={openMuscleGroup}
    toggleMuscleGroup={toggleMuscleGroup}

    isSelected={isSelected}
    onPick={onPick}
/>
          ))}
        </div>
      </div>
    </div>
  );
}

function MuscleGroupAccordion({ muscleGroup,sectionId,exerciseType,openMuscleGroup,toggleMuscleGroup,isSelected,onPick}) 
{
  const key = `${sectionId}:${muscleGroup}`;
  const isOpen = openMuscleGroup === key;
  const exercises = useMemo(
    () => getExercisesFor(exerciseType, sectionId, muscleGroup),
    [exerciseType, sectionId, muscleGroup]
  );

  if (exercises.length === 0) return null;

  return (
    <div className={`acc-muscle ${isOpen ? 'open' : ''}`}>
      <button type="button" className="acc-muscle-header" onMouseDown={(e) => e.preventDefault()} onClick={() => toggleMuscleGroup(key)}>
        <span className="acc-muscle-name">{muscleGroup}</span>
        <span className="acc-muscle-count">({exercises.length})</span>
        <span className="acc-chevron">⌄</span>
      </button>
      <div className="acc-muscle-body" style={{ maxHeight: isOpen ? '1200px' : '0px' }}>
        <div className="ex-grid">
          {exercises.map((ex) => (
            <ExerciseChip key={`${key}:${ex.key}`} ex={ex} selected={isSelected(ex)} onPick={onPick} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseChip({ ex, selected, onPick }) {
  return (
    <button
      type="button"
      className={`ex-chip ${selected ? 'selected' : ''} ${!ex.trackable ? 'untracked' : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onPick(ex)}
      title={!ex.trackable ? 'No camera tracking yet — browsable only' : undefined}
    >
      <span className="ex-chip-name">{ex.name}</span>
      <span className="ex-chip-meta">{ex.equipment}</span>
      {ex.isHold && <span className="ex-chip-flag ex-chip-flag-hold" title="Hold-timer exercise">⏱</span>}
      {!ex.trackable && <span className="ex-chip-flag">●</span>}
    </button>
  );
}