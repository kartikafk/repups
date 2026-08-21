import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Settings,
  Pencil,
  Target,
  Home,
  Dumbbell,
  Users,
  Compass,
  User,
  Check,
  X,
} from "lucide-react";

import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

const GOALS = ["Cut", "Bulk", "Recomp", "Maintain"];

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "?";

export default function ClientProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    goal: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const C = {
    bg: "#030405",
    surface: "#090B0D",
    surface2: "#0D1012",
    border: "#242A2F",
    lime: "#C8FF3D",
    blue: "#1687FF",
    text: "#FFFFFF",
    muted: "#90989E",
    green: "#27C95D",
  };

  useEffect(() => {
    fetch(apiUrl("me"), {
      headers: authHeaders(),
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Request failed");
        }

        return data;
      })
      .then((data) => {
        setUser(data.user);

        setForm({
          name: data.user.name || "",
          age: data.user.age ?? "",
          goal: data.user.goal || "",
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const body = new FormData();
    body.append("photo", file);

    try {
      setUploadingPhoto(true);
      setError("");

      const response = await fetch(apiUrl("me/photo"), {
        method: "POST",
        headers: authHeaders(),
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setUser(data.user);

      setSaveMsg("Photo updated âœ“");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveMsg("");

    try {
      const response = await fetch(apiUrl("me"), {
        method: "PATCH",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setUser(data.user);
      setEditMode(false);
      setSaveMsg("Saved âœ“");
    } catch (err) {
      setSaveMsg(err.message || "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2500);
    }
  };

  const cancelEdit = () => {
    setForm({
      name: user?.name || "",
      age: user?.age ?? "",
      goal: user?.goal || "",
    });

    setEditMode(false);
  };

  /*
    These read real backend values when they exist.
    Otherwise they safely display 0 / no score instead of hardcoded fake data.
  */
  const stats = useMemo(
    () => ({
      workouts:
        user?.stats?.workouts ??
        user?.workoutsCompleted ??
        user?.workoutCount ??
        0,

      followers:
        user?.stats?.followers ??
        user?.followersCount ??
        0,

      following:
        user?.stats?.following ??
        user?.followingCount ??
        0,

      postureScore:
        user?.postureScore ??
        user?.latestPostureScore ??
        user?.stats?.postureScore ??
        null,

      postureChange:
        user?.postureChange ??
        user?.stats?.postureChange ??
        null,
    }),
    [user]
  );

  const profileGoals = useMemo(() => {
    if (Array.isArray(user?.goals) && user.goals.length) {
      return user.goals.slice(0, 3);
    }

    if (form.goal) {
      return [
        {
          title: form.goal,
          subtitle: "Primary fitness goal",
          progress: 0,
          completed: 0,
          total: 1,
          unit: "goal",
        },
      ];
    }

    return [];
  }, [user, form.goal]);

  const formatCompact = (value) => {
    const n = Number(value || 0);

    if (n >= 1000000) {
      return `${(n / 1000000).toFixed(1)}M`;
    }

    if (n >= 1000) {
      return `${(n / 1000).toFixed(1)}K`;
    }

    return String(n);
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily:
        'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },

    shell: {
      width: "100%",
      maxWidth: 430,
      minHeight: "100vh",
      margin: "0 auto",
      paddingBottom: 88,
      background: C.bg,
      boxSizing: "border-box",
    },

    topbar: {
      minHeight: 70,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 18px",
      borderBottom: `1px solid ${C.border}`,
      boxSizing: "border-box",
    },

    logo: {
      fontSize: 22,
      fontWeight: 850,
      letterSpacing: "-0.8px",
    },

    settingsBtn: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      border: 0,
      background: "transparent",
      color: "#C7CDD1",
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
    },

    content: {
      padding: "14px 16px 24px",
    },

    profileHeader: {
      display: "grid",
      gridTemplateColumns: "106px minmax(0,1fr) 40px",
      gap: 14,
      alignItems: "center",
      marginBottom: 12,
    },

    avatarWrap: {
      position: "relative",
      width: 104,
      height: 104,
    },

    avatar: {
      width: 104,
      height: 104,
      borderRadius: "50%",
      border: `2px solid ${C.lime}`,
      background: "#111519",
      display: "grid",
      placeItems: "center",
      backgroundSize: "cover",
      backgroundPosition: "center",
      color: C.text,
      fontSize: 28,
      fontWeight: 800,
      boxSizing: "border-box",
      overflow: "hidden",
    },

    cameraLabel: {
      position: "absolute",
      right: 0,
      bottom: 3,
      width: 34,
      height: 34,
      borderRadius: "50%",
      border: `1px solid ${C.border}`,
      background: "#101417",
      color: C.text,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
    },

    hiddenInput: {
      display: "none",
    },

    nameRow: {
      display: "flex",
      alignItems: "center",
      gap: 6,
    },

    name: {
      margin: 0,
      fontSize: 19,
      fontWeight: 800,
      lineHeight: 1.1,
    },

    verified: {
      color: C.blue,
      fontSize: 13,
    },

    username: {
      margin: "4px 0 0",
      color: C.muted,
      fontSize: 10,
    },

    memberBadge: {
      width: "fit-content",
      marginTop: 8,
      padding: "5px 9px",
      borderRadius: 8,
      background: "rgba(200,255,61,.09)",
      color: C.lime,
      fontSize: 9,
      fontWeight: 750,
    },

    online: {
      marginTop: 7,
      display: "flex",
      alignItems: "center",
      gap: 6,
      color: C.muted,
      fontSize: 9,
    },

    onlineDot: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: C.green,
    },

    editSmall: {
      width: 38,
      height: 38,
      borderRadius: 9,
      border: `1px solid ${C.border}`,
      background: C.surface,
      color: C.text,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
    },

    bio: {
      margin: "8px 0 14px",
      color: "#D0D5D8",
      fontSize: 11,
      lineHeight: 1.45,
    },

    statGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 7,
      marginBottom: 10,
    },

    statCard: {
      minHeight: 56,
      border: `1px solid ${C.border}`,
      borderRadius: 9,
      background: C.surface,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },

    statLabel: {
      color: C.muted,
      fontSize: 8,
    },

    statValue: {
      marginTop: 4,
      fontSize: 16,
      fontWeight: 800,
    },

    card: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 11,
      boxSizing: "border-box",
    },

    postureCard: {
      minHeight: 102,
      padding: 11,
      marginBottom: 13,
    },

    postureHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },

    cardTitle: {
      margin: 0,
      fontSize: 11,
      fontWeight: 700,
    },

    change: {
      color: C.lime,
      fontSize: 8,
    },

    postureContent: {
      display: "grid",
      gridTemplateColumns: "70px 1fr",
      gap: 12,
      alignItems: "center",
    },

    scoreRing: {
      width: 58,
      height: 58,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      background: stats.postureScore
        ? `conic-gradient(${C.lime} ${
            Number(stats.postureScore) * 3.6
          }deg, #2A3034 0deg)`
        : "#242A2E",
    },

    scoreRingInner: {
      width: 47,
      height: 47,
      borderRadius: "50%",
      background: C.surface,
      display: "grid",
      placeItems: "center",
      textAlign: "center",
    },

    scoreNumber: {
      fontSize: 20,
      fontWeight: 850,
      lineHeight: 1,
    },

    scoreOutOf: {
      marginTop: 2,
      fontSize: 7,
      color: C.muted,
    },

    good: {
      marginTop: 5,
      color: C.lime,
      fontSize: 9,
      fontWeight: 700,
    },

    chart: {
      width: "100%",
      height: 62,
      display: "block",
    },

    progressLink: {
      marginTop: 3,
      textAlign: "right",
      color: C.blue,
      fontSize: 8,
      cursor: "pointer",
    },

    goalsHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 7,
    },

    sectionTitle: {
      margin: 0,
      fontSize: 12,
      fontWeight: 800,
    },

    textBtn: {
      border: 0,
      background: "transparent",
      color: C.blue,
      fontSize: 9,
      cursor: "pointer",
      padding: 0,
    },

    goalCard: {
      minHeight: 64,
      padding: "9px 10px",
      marginBottom: 7,
      display: "grid",
      gridTemplateColumns: "1fr 38px",
      gap: 9,
      alignItems: "center",
    },

    goalTitle: {
      fontSize: 10,
      fontWeight: 750,
    },

    goalSub: {
      marginTop: 3,
      color: C.muted,
      fontSize: 8,
    },

    goalStats: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 6,
      color: C.muted,
      fontSize: 8,
    },

    progressTrack: {
      flex: 1,
      height: 4,
      borderRadius: 999,
      background: "#262C30",
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      borderRadius: 999,
      background: C.lime,
    },

    targetIcon: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "rgba(200,255,61,.08)",
      color: C.lime,
      display: "grid",
      placeItems: "center",
    },

    emptyGoals: {
      padding: 14,
      color: C.muted,
      fontSize: 9,
      textAlign: "center",
      marginBottom: 10,
    },

    primaryBtn: {
      width: "100%",
      height: 43,
      border: 0,
      borderRadius: 9,
      background: C.lime,
      color: "#070905",
      fontSize: 11,
      fontWeight: 850,
      cursor: "pointer",
      marginTop: 6,
    },

    saveMessage: {
      margin: "8px 0 0",
      textAlign: "center",
      color: C.lime,
      fontSize: 9,
    },

    editPanel: {
      marginTop: 11,
      padding: 12,
    },

    editGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginTop: 10,
    },

    fieldFull: {
      gridColumn: "1 / -1",
    },

    inputLabel: {
      display: "block",
      color: C.muted,
      fontSize: 8,
      marginBottom: 5,
    },

    input: {
      width: "100%",
      height: 40,
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      outline: 0,
      background: "#07090B",
      color: C.text,
      padding: "0 10px",
      boxSizing: "border-box",
      fontSize: 10,
    },

    disabledInput: {
      opacity: 0.55,
    },

    editActions: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginTop: 10,
    },

    cancelBtn: {
      height: 40,
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      background: "transparent",
      color: C.text,
      fontSize: 9,
      fontWeight: 700,
      cursor: "pointer",
    },

    saveBtn: {
      height: 40,
      borderRadius: 8,
      border: 0,
      background: C.lime,
      color: "#070905",
      fontSize: 9,
      fontWeight: 800,
      cursor: "pointer",
    },

    stateCenter: {
      minHeight: "70vh",
      display: "grid",
      placeItems: "center",
      padding: 24,
      textAlign: "center",
      color: C.muted,
      fontSize: 11,
    },

    errorBox: {
      padding: 16,
      border: `1px solid #542B2B`,
      background: "#140909",
      borderRadius: 10,
      color: "#FF7C7C",
    },

    bottomNav: {
      position: "fixed",
      zIndex: 1000,
      left: "50%",
      bottom: 0,
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 430,
      height: 72,
      display: "grid",
      gridTemplateColumns: "repeat(5,1fr)",
      padding: "8px 4px 10px",
      background: "rgba(3,4,5,.98)",
      borderTop: `1px solid ${C.border}`,
      boxSizing: "border-box",
    },

    navBtn: {
      border: 0,
      background: "transparent",
      color: "#858D93",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      fontSize: 7.5,
      cursor: "pointer",
    },

    navActive: {
      color: C.lime,
    },
  };

  const navItems = [
    {
      label: "Home",
      path: "/dashboard",
      icon: <Home size={20} />,
    },
    {
      label: "Workout",
      path: "/session",
      icon: <Dumbbell size={20} />,
    },
    {
      label: "Community",
      path: "/community",
      icon: <Users size={20} />,
    },
    {
      label: "Explore",
      path: "/client/events-gyms",
      icon: <Compass size={20} />,
    },
    {
      label: "Profile",
      path: "/client/profile",
      icon: <User size={20} />,
      active: true,
    },
  ];

  if (error && !user) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <header style={styles.topbar}>
            <div style={styles.logo}>
              Rep<span style={{ color: C.lime }}>Ups</span>
            </div>
          </header>

          <main style={styles.stateCenter}>
            <div style={styles.errorBox}>{error}</div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <header style={styles.topbar}>
            <div style={styles.logo}>
              Rep<span style={{ color: C.lime }}>Ups</span>
            </div>
          </header>

          <main style={styles.stateCenter}>
            Loading profileâ€¦
          </main>
        </div>
      </div>
    );
  }

  const postureScore =
    stats.postureScore !== null ? Number(stats.postureScore) : null;

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        {/* TOP BAR */}
        <header style={styles.topbar}>
          <div style={styles.logo}>
            Rep<span style={{ color: C.lime }}>Ups</span>
          </div>

          <button
            type="button"
            style={styles.settingsBtn}
            aria-label="Settings"
          >
            <Settings size={19} />
          </button>
        </header>

        <main style={styles.content}>
          {/* PROFILE HEADER */}
          <section style={styles.profileHeader}>
            <div style={styles.avatarWrap}>
              <div
                style={{
                  ...styles.avatar,
                  ...(user.photoUrl
                    ? {
                        backgroundImage: `url(${user.photoUrl})`,
                      }
                    : {}),
                }}
              >
                {!user.photoUrl && initials(user.name)}
              </div>

              <label
                htmlFor="client-profile-photo"
                style={styles.cameraLabel}
                title="Change profile photo"
              >
                {uploadingPhoto ? (
                  <span style={{ fontSize: 8 }}>...</span>
                ) : (
                  <Camera size={16} />
                )}
              </label>

              <input
                id="client-profile-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={uploadPhoto}
                style={styles.hiddenInput}
              />
            </div>

            <div>
              <div style={styles.nameRow}>
                <h1 style={styles.name}>{user.name || "Client"}</h1>
                <span style={styles.verified}>â—†</span>
              </div>

              <p style={styles.username}>
                @{user.username || user.email?.split("@")[0] || "member"}
              </p>

              <div style={styles.memberBadge}>
                ðŸ‘‘ Pro Member
              </div>

              <div style={styles.online}>
                <span style={styles.onlineDot} />
                Online
              </div>
            </div>

            <button
              type="button"
              style={styles.editSmall}
              onClick={() => setEditMode(true)}
              aria-label="Edit profile"
            >
              <Pencil size={16} />
            </button>
          </section>

          <p style={styles.bio}>
            {user.bio ||
              "Focused on strength, posture, and longevity. Engineering better movement every day."}
          </p>

          {/* STATS */}
          <section style={styles.statGrid}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Workouts</span>
              <strong style={styles.statValue}>
                {formatCompact(stats.workouts)}
              </strong>
            </div>

            <div style={styles.statCard}>
              <span style={styles.statLabel}>Follower</span>
              <strong style={styles.statValue}>
                {formatCompact(stats.followers)}
              </strong>
            </div>

            <div style={styles.statCard}>
              <span style={styles.statLabel}>Following</span>
              <strong style={styles.statValue}>
                {formatCompact(stats.following)}
              </strong>
            </div>
          </section>

          {/* POSTURE SCORE */}
          <section style={{ ...styles.card, ...styles.postureCard }}>
            <div style={styles.postureHeader}>
              <h2 style={styles.cardTitle}>Posture Score</h2>

              {stats.postureChange !== null && (
                <span style={styles.change}>
                  {Number(stats.postureChange) >= 0 ? "+" : ""}
                  {stats.postureChange}
                </span>
              )}
            </div>

            <div style={styles.postureContent}>
              <div>
                <div style={styles.scoreRing}>
                  <div style={styles.scoreRingInner}>
                    <div>
                      <div style={styles.scoreNumber}>
                        {postureScore ?? "--"}
                      </div>
                      <div style={styles.scoreOutOf}>/100</div>
                    </div>
                  </div>
                </div>

                <div style={styles.good}>
                  {postureScore === null
                    ? "No scan yet"
                    : postureScore >= 80
                    ? "Good"
                    : postureScore >= 60
                    ? "Fair"
                    : "Needs Work"}
                </div>
              </div>

              <div>
                <svg
                  viewBox="0 0 220 60"
                  preserveAspectRatio="none"
                  style={styles.chart}
                >
                  <line
                    x1="0"
                    y1="51"
                    x2="220"
                    y2="51"
                    stroke="#1F2529"
                    strokeWidth="1"
                  />

                  <polyline
                    points="2,45 28,43 54,34 80,40 106,33 132,25 158,30 184,15 216,11"
                    fill="none"
                    stroke={C.blue}
                    strokeWidth="2"
                  />

                  {[2, 28, 54, 80, 106, 132, 158, 184, 216].map(
                    (x, index) => {
                      const y = [45, 43, 34, 40, 33, 25, 30, 15, 11][index];

                      return (
                        <circle
                          key={x}
                          cx={x}
                          cy={y}
                          r="2.7"
                          fill={index < 3 ? C.lime : C.blue}
                        />
                      );
                    }
                  )}
                </svg>

                <div
                  style={styles.progressLink}
                  onClick={() => navigate("/posture-assessment")}
                >
                  View Progress
                </div>
              </div>
            </div>
          </section>

          {/* GOALS */}
          <section>
            <div style={styles.goalsHeader}>
              <h2 style={styles.sectionTitle}>My Goals</h2>

              <button
                type="button"
                style={styles.textBtn}
                onClick={() => setEditMode(true)}
              >
                Edit Goals
              </button>
            </div>

            {profileGoals.length ? (
              profileGoals.map((goal, index) => {
                const progress = Math.max(
                  0,
                  Math.min(
                    100,
                    Number(
                      goal.progress ??
                        ((goal.completed || 0) /
                          Math.max(goal.total || 1, 1)) *
                          100
                    )
                  )
                );

                return (
                  <div
                    key={`${goal.title || "goal"}-${index}`}
                    style={{ ...styles.card, ...styles.goalCard }}
                  >
                    <div>
                      <div style={styles.goalTitle}>
                        {goal.title || form.goal}
                      </div>

                      <div style={styles.goalSub}>
                        {goal.subtitle || "Personal fitness goal"}
                      </div>

                      <div style={styles.goalStats}>
                        <span>
                          {goal.completed ?? 0} / {goal.total ?? 1}{" "}
                          {goal.unit || ""}
                        </span>

                        <div style={styles.progressTrack}>
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={styles.targetIcon}>
                      <Target size={18} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ ...styles.card, ...styles.emptyGoals }}>
                No goal selected yet.
              </div>
            )}
          </section>

          {/* EDIT PROFILE */}
          {!editMode && (
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </button>
          )}

          {editMode && (
            <section style={{ ...styles.card, ...styles.editPanel }}>
              <div style={styles.goalsHeader}>
                <h2 style={styles.sectionTitle}>Edit Profile</h2>

                <button
                  type="button"
                  style={styles.iconBtn}
                  onClick={cancelEdit}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={styles.editGrid}>
                <div style={styles.fieldFull}>
                  <label style={styles.inputLabel}>Name</label>

                  <input
                    style={styles.input}
                    value={form.name}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>

                <div style={styles.fieldFull}>
                  <label style={styles.inputLabel}>Email</label>

                  <input
                    style={{
                      ...styles.input,
                      ...styles.disabledInput,
                    }}
                    value={user.email || ""}
                    disabled
                  />
                </div>

                <div>
                  <label style={styles.inputLabel}>Age</label>

                  <input
                    type="number"
                    min="0"
                    style={styles.input}
                    value={form.age}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        age: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label style={styles.inputLabel}>Goal</label>

                  <select
                    style={styles.input}
                    value={form.goal}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        goal: e.target.value,
                      }))
                    }
                  >
                    <option value="">Selectâ€¦</option>

                    {GOALS.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.editActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={cancelEdit}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  style={styles.saveBtn}
                  onClick={saveProfile}
                  disabled={saving}
                >
                  {saving ? "Savingâ€¦" : "Save Profile"}
                </button>
              </div>
            </section>
          )}

          {saveMsg && (
            <p style={styles.saveMessage}>
              <Check size={12} style={{ verticalAlign: "middle" }} />{" "}
              {saveMsg}
            </p>
          )}

          {error && user && (
            <p
              style={{
                marginTop: 8,
                textAlign: "center",
                color: "#FF6B6B",
                fontSize: 9,
              }}
            >
              {error}
            </p>
          )}
        </main>
      </div>

    </div>
  );
}
