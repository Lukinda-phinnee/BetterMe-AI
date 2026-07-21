import { useState, useMemo } from "react";
import {
  Plus, ChevronLeft, ChevronRight, Check, Flame, Droplet, BookOpen,
  Dumbbell, Moon, Wind, Sparkles, MoreHorizontal, Pencil, Trash2, X
} from "lucide-react";

const ICONS = { droplet: Droplet, book: BookOpen, dumbbell: Dumbbell, moon: Moon, wind: Wind, sparkles: Sparkles };

const CUE_PRESETS = [
  "Right after I wake up",
  "Right after I brush my teeth",
  "Right before I sit down to eat",
  "Right when I get into bed",
  "Custom trigger",
];

const TEMPLATES = [
  { name: "Drink a glass of water", icon: "droplet", cue: "Right after I wake up", behavior: "drink one full glass of water", reward: "Cross off today's tally — first win of the day", friction: "Leave a filled glass on the nightstand the night before" },
  { name: "Read before bed", icon: "book", cue: "Right when I get into bed", behavior: "read 10 pages", reward: "Feel the day properly close", friction: "Put the book on the pillow, phone charges in the kitchen" },
  { name: "Stretch", icon: "dumbbell", cue: "Right after I brush my teeth", behavior: "do 5 minutes of stretching", reward: "Notice the tension leave your shoulders", friction: "Keep a mat unrolled next to the sink" },
  { name: "Wind down", icon: "moon", cue: "Right when I get into bed", behavior: "write down tomorrow's top 3 priorities", reward: "Fall asleep without the mental list running", friction: "Keep a notepad and pen on the nightstand, not the phone" },
];

const seedHabits = () => ([
  {
    id: "h1", name: "Drink a glass of water", icon: "droplet",
    cue: "Right after I wake up", location: "kitchen", behavior: "drink one full glass of water",
    reward: "Cross off today's tally — first win of the day", friction: "Leave a filled glass on the nightstand the night before",
    tally: [1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
  },
  {
    id: "h2", name: "Read before bed", icon: "book",
    cue: "Right when I get into bed", location: "bedroom", behavior: "read 10 pages",
    reward: "Feel the day properly close", friction: "Book stays on the pillow, phone charges in the kitchen",
    tally: [1,0,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,0],
  },
  {
    id: "h3", name: "Stretch", icon: "dumbbell",
    cue: "Right after I brush my teeth", location: "bathroom floor", behavior: "5 minutes of stretching",
    reward: "Notice the tension leave your shoulders", friction: "Mat stays unrolled by the sink",
    tally: [0,0,1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0],
  },
]);

function computeStats(tally) {
  let current = 0;
  for (let i = tally.length - 1; i >= 0; i--) { if (tally[i]) current++; else break; }
  let longest = 0, run = 0;
  tally.forEach(v => { if (v) { run++; longest = Math.max(longest, run); } else run = 0; });
  const rate = Math.round((tally.filter(Boolean).length / tally.length) * 100);
  return { current, longest, rate };
}

function TallyMarks({ tally }) {
  const groups = [];
  for (let i = 0; i < tally.length; i += 5) groups.push(tally.slice(i, i + 5));
  return (
    <div style={t.tallyRow}>
      {groups.map((g, gi) => (
        <svg key={gi} width={g.length === 5 ? 34 : g.length * 6} height="22" style={{ marginRight: 8 }}>
          {g.map((done, i) =>
            i < 4 ? (
              <line key={i} x1={4 + i * 7} y1={2} x2={4 + i * 7} y2={20}
                stroke={done ? "#4B6B4E" : "#D8DCCC"} strokeWidth="2.5" strokeLinecap="round" />
            ) : (
              <line key={i} x1={1} y1={19} x2={27} y2={3}
                stroke={done ? "#4B6B4E" : "#D8DCCC"} strokeWidth="2.5" strokeLinecap="round" />
            )
          )}
        </svg>
      ))}
    </div>
  );
}

export default function HabitApp() {
  const [view, setView] = useState("list");
  const [habits, setHabits] = useState(seedHabits());
  const [selectedId, setSelectedId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  const selected = habits.find(h => h.id === selectedId);

  const toggleToday = (id) => {
    setHabits(hs => hs.map(h => {
      if (h.id !== id) return h;
      const t = [...h.tally];
      t[t.length - 1] = t[t.length - 1] ? 0 : 1;
      return { ...h, tally: t };
    }));
  };

  const deleteHabit = (id) => {
    setHabits(hs => hs.filter(h => h.id !== id));
    setView("list");
  };

  const saveDraft = (draft) => {
    if (draft.id) {
      setHabits(hs => hs.map(h => h.id === draft.id ? { ...h, ...draft } : h));
    } else {
      setHabits(hs => [...hs, { ...draft, id: "h" + Date.now(), icon: draft.icon || "sparkles", tally: new Array(30).fill(0) }]);
    }
    setView("list");
  };

  if (view === "form") {
    return <HabitForm initial={editDraft} onCancel={() => setView(editDraft?.id ? "detail" : "list")} onSave={saveDraft} />;
  }
  if (view === "detail" && selected) {
    return (
      <HabitDetail
        habit={selected}
        onBack={() => setView("list")}
        onToggleToday={() => toggleToday(selected.id)}
        onEdit={() => { setEditDraft(selected); setView("form"); }}
        onDelete={() => deleteHabit(selected.id)}
      />
    );
  }
  return (
    <HabitsList
      habits={habits}
      onOpen={(id) => { setSelectedId(id); setView("detail"); }}
      onToggleToday={toggleToday}
      onAdd={() => { setEditDraft(null); setView("form"); }}
    />
  );
}

function HabitsList({ habits, onOpen, onToggleToday, onAdd }) {
  return (
    <div style={t.page}>
      <div style={t.dotGrid} />
      <div style={t.header}>
        <div style={t.eyebrow}>FIELD NOTES</div>
        <div style={t.title}>Your habits</div>
        <div style={t.subtitle}>{habits.length} in progress</div>
      </div>

      <div style={t.list}>
        {habits.map(h => {
          const Icon = ICONS[h.icon] || Sparkles;
          const stats = computeStats(h.tally);
          const doneToday = h.tally[h.tally.length - 1] === 1;
          return (
            <div key={h.id} style={t.card}>
              <button style={t.cardMain} onClick={() => onOpen(h.id)}>
                <div style={t.cardIconWrap}><Icon size={17} color="#4B6B4E" /></div>
                <div style={t.cardBody}>
                  <div style={t.cardName}>{h.name}</div>
                  <TallyMarks tally={h.tally.slice(-15)} />
                  <div style={t.cardMeta}>
                    <Flame size={12} color={stats.current > 0 ? "#B4633B" : "#B8BCA9"} />
                    <span style={{ color: stats.current > 0 ? "#B4633B" : "#8A9080" }}>{stats.current} day streak</span>
                    <span style={t.metaDot}>·</span>
                    <span>{stats.rate}% last 30d</span>
                  </div>
                </div>
              </button>
              <button
                style={{ ...t.checkBtn, ...(doneToday ? t.checkBtnDone : {}) }}
                onClick={() => onToggleToday(h.id)}
                aria-label="Mark today done"
              >
                <Check size={16} strokeWidth={3} color={doneToday ? "#F4F6EF" : "#4B6B4E"} />
              </button>
            </div>
          );
        })}
      </div>

      <button style={t.fab} onClick={onAdd}>
        <Plus size={22} color="#F4F6EF" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function HabitDetail({ habit, onBack, onToggleToday, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = ICONS[habit.icon] || Sparkles;
  const stats = computeStats(habit.tally);
  const doneToday = habit.tally[habit.tally.length - 1] === 1;
  const sentence = `When ${habit.cue.charAt(0).toLowerCase() + habit.cue.slice(1)}${habit.location ? ` (${habit.location})` : ""}, I will ${habit.behavior}.`;

  return (
    <div style={t.page}>
      <div style={t.dotGrid} />
      <div style={t.detailTopBar}>
        <button style={t.iconBtn} onClick={onBack}><ChevronLeft size={20} color="#1F2A22" /></button>
        <button style={t.iconBtn} onClick={() => setMenuOpen(m => !m)}><MoreHorizontal size={20} color="#1F2A22" /></button>
      </div>
      {menuOpen && (
        <div style={t.menu}>
          <button style={t.menuItem} onClick={() => { setMenuOpen(false); onEdit(); }}>
            <Pencil size={14} /> Edit habit
          </button>
          <button style={{ ...t.menuItem, color: "#B4633B" }} onClick={() => { setMenuOpen(false); onDelete(); }}>
            <Trash2 size={14} /> Delete habit
          </button>
        </div>
      )}

      <div style={t.detailHeader}>
        <div style={t.detailIconWrap}><Icon size={26} color="#4B6B4E" /></div>
        <div style={t.detailTitle}>{habit.name}</div>
      </div>

      <div style={t.statsRow}>
        <div style={t.statBox}>
          <div style={t.statNum}>{stats.current}</div>
          <div style={t.statLabel}>current streak</div>
        </div>
        <div style={t.statBox}>
          <div style={t.statNum}>{stats.longest}</div>
          <div style={t.statLabel}>longest streak</div>
        </div>
        <div style={t.statBox}>
          <div style={t.statNum}>{stats.rate}%</div>
          <div style={t.statLabel}>last 30 days</div>
        </div>
      </div>

      <div style={t.card2}>
        <div style={t.cardLabel}>Implementation intention</div>
        <div style={t.sentence}>{sentence}</div>
      </div>

      <div style={t.card2}>
        <div style={t.cardLabel}>Reward</div>
        <div style={t.plainText}>{habit.reward}</div>
      </div>

      <div style={t.card2}>
        <div style={t.cardLabel}>Friction removed</div>
        <div style={t.plainText}>{habit.friction}</div>
      </div>

      <div style={t.card2}>
        <div style={t.cardLabel}>Last 30 days</div>
        <TallyMarks tally={habit.tally} />
      </div>

      <button style={{ ...t.bigCheckBtn, ...(doneToday ? t.bigCheckBtnDone : {}) }} onClick={onToggleToday}>
        <Check size={18} strokeWidth={3} />
        {doneToday ? "Marked done today" : "Mark today done"}
      </button>
    </div>
  );
}

function HabitForm({ initial, onCancel, onSave }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name || "");
  const [icon, setIcon] = useState(initial?.icon || "sparkles");
  const [cue, setCue] = useState(initial?.cue || "");
  const [customCue, setCustomCue] = useState(CUE_PRESETS.includes(initial?.cue) ? "" : (initial?.cue || ""));
  const [location, setLocation] = useState(initial?.location || "");
  const [behavior, setBehavior] = useState(initial?.behavior || "");
  const [reward, setReward] = useState(initial?.reward || "");
  const [friction, setFriction] = useState(initial?.friction || "");

  const effectiveCue = cue === "Custom trigger" ? customCue : cue;
  const sentence = `When ${(effectiveCue || "…").charAt(0).toLowerCase() + (effectiveCue || "…").slice(1)}${location ? ` (${location})` : ""}, I will ${behavior || "…"}.`;

  const applyTemplate = (tpl) => {
    setName(tpl.name); setIcon(tpl.icon); setCue(tpl.cue);
    setBehavior(tpl.behavior); setReward(tpl.reward); setFriction(tpl.friction);
    setStep(1);
  };

  const steps = ["Basics", "Trigger", "Reward & friction", "Confirm"];
  const canAdvance = step === 0 ? name.trim() && behavior.trim() : step === 1 ? !!effectiveCue : true;

  return (
    <div style={t.page}>
      <div style={t.dotGrid} />
      <div style={t.detailTopBar}>
        <button style={t.iconBtn} onClick={onCancel}><X size={20} color="#1F2A22" /></button>
      </div>
      <div style={t.header}>
        <div style={t.eyebrow}>{initial?.id ? "EDIT HABIT" : "NEW HABIT"}</div>
        <div style={t.title}>{initial?.id ? "Sharpen the trigger" : "Start with a trigger"}</div>
      </div>

      <div style={t.progressRow}>
        {steps.map((label, i) => (
          <div key={label} style={t.progressItem}>
            <div style={{ ...t.progressDot, ...(i <= step ? t.progressDotActive : {}) }}>
              {i < step ? <Check size={11} strokeWidth={3} color="#F4F6EF" /> : i + 1}
            </div>
            {i < steps.length - 1 && <div style={t.progressLine} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div style={t.card2}>
          {!initial?.id && (
            <>
              <div style={t.cardLabel}>Or start from a tested template</div>
              <div style={t.templateGrid}>
                {TEMPLATES.map(tpl => {
                  const TIcon = ICONS[tpl.icon];
                  return (
                    <button key={tpl.name} style={t.templateChip} onClick={() => applyTemplate(tpl)}>
                      <TIcon size={14} color="#4B6B4E" /> {tpl.name}
                    </button>
                  );
                })}
              </div>
              <div style={t.divider}><span>or build your own</span></div>
            </>
          )}
          <div style={t.cardLabel}>What's the habit called?</div>
          <input style={t.input} placeholder="e.g. Drink more water" value={name} onChange={e => setName(e.target.value)} />
          <div style={{ ...t.cardLabel, marginTop: 16 }}>The exact action — one motor step, not a goal</div>
          <textarea style={t.textarea} rows={2} placeholder="e.g. drink one full glass of water"
            value={behavior} onChange={e => setBehavior(e.target.value)} />
          <div style={t.warnBox}>Vague behaviors don't automate. "Be healthier" fails. "Drink one glass" works.</div>
        </div>
      )}

      {step === 1 && (
        <div style={t.card2}>
          <div style={t.cardLabel}>What's the exact moment this fires?</div>
          {CUE_PRESETS.map(c => {
            const active = cue === c;
            return (
              <button key={c} style={{ ...t.optionRow, ...(active ? t.optionRowActive : {}) }} onClick={() => setCue(c)}>
                <span style={{ color: active ? "#1F2A22" : "#54604F", fontWeight: active ? 600 : 400 }}>{c}</span>
              </button>
            );
          })}
          {cue === "Custom trigger" && (
            <input style={t.input} placeholder="e.g. When I pour my morning coffee"
              value={customCue} onChange={e => setCustomCue(e.target.value)} />
          )}
          <div style={{ ...t.cardLabel, marginTop: 16 }}>Where does this happen? <span style={t.optional}>(optional)</span></div>
          <input style={t.input} placeholder="e.g. kitchen" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
      )}

      {step === 2 && (
        <div style={t.card2}>
          <div style={t.cardLabel}>What's the immediate reward — however small?</div>
          <div style={t.cardHint}>The brain reinforces the cue when it expects something back right away. Name it.</div>
          <textarea style={t.textarea} rows={2} placeholder="e.g. cross off today's tally"
            value={reward} onChange={e => setReward(e.target.value)} />
          <div style={{ ...t.cardLabel, marginTop: 16 }}>What's making this harder than it needs to be?</div>
          <textarea style={t.textarea} rows={2} placeholder="e.g. leave the book on the pillow, phone in the kitchen"
            value={friction} onChange={e => setFriction(e.target.value)} />
        </div>
      )}

      {step === 3 && (
        <div style={t.card2}>
          <div style={t.cardLabel}>Implementation intention</div>
          <div style={t.sentence}>{sentence}</div>
          {reward && <><div style={{ ...t.cardLabel, marginTop: 16 }}>Reward</div><div style={t.plainText}>{reward}</div></>}
          {friction && <><div style={{ ...t.cardLabel, marginTop: 16 }}>Friction removed</div><div style={t.plainText}>{friction}</div></>}
          <div style={t.evidenceNote}>Median time to automaticity: 66 days. Miss a day, don't miss the trigger.</div>
        </div>
      )}

      <div style={t.footer}>
        {step > 0 && <button style={t.backBtn} onClick={() => setStep(step - 1)}>Back</button>}
        <button
          style={{ ...t.nextBtn, ...(canAdvance ? {} : t.nextBtnDisabled) }}
          disabled={!canAdvance}
          onClick={() => step === 3
            ? onSave({ id: initial?.id, name, icon, cue: effectiveCue, location, behavior, reward, friction })
            : setStep(step + 1)}
        >
          {step === 3 ? (initial?.id ? "Save changes" : "Start this habit") : "Continue"}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

const t = {
  page: {
    minHeight: "100vh", background: "#EEF1EA", color: "#1F2A22",
    fontFamily: "'Inter', -apple-system, sans-serif",
    padding: "24px 20px 100px", maxWidth: 420, margin: "0 auto",
    boxSizing: "border-box", position: "relative",
  },
  dotGrid: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: "radial-gradient(#C9CFC0 1px, transparent 1px)",
    backgroundSize: "16px 16px", opacity: 0.6,
  },
  header: { marginBottom: 20, position: "relative" },
  eyebrow: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.14em", color: "#B4633B", fontWeight: 600, marginBottom: 6 },
  title: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 600, color: "#1F2A22" },
  subtitle: { fontSize: 13, color: "#6E7A67", marginTop: 4 },
  list: { display: "flex", flexDirection: "column", gap: 10, position: "relative" },
  card: {
    display: "flex", alignItems: "center", gap: 10,
    background: "#F7F8F2", border: "1px solid #DCE1D2", borderRadius: 12, padding: 12,
  },
  cardMain: { display: "flex", alignItems: "flex-start", gap: 12, flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 },
  cardIconWrap: { width: 36, height: 36, borderRadius: 9, background: "#E4E9D9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 14.5, fontWeight: 600, color: "#1F2A22", marginBottom: 6, fontFamily: "'Fraunces', Georgia, serif" },
  cardMeta: { display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#6E7A67", marginTop: 4 },
  metaDot: { color: "#C4CBB6" },
  checkBtn: { width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #4B6B4E", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
  checkBtnDone: { background: "#4B6B4E" },
  fab: {
    position: "fixed", bottom: 28, right: "calc(50% - 190px)", width: 52, height: 52, borderRadius: "50%",
    background: "#4B6B4E", border: "none", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: "0 6px 16px rgba(75,107,78,0.35)",
  },
  tallyRow: { display: "flex", alignItems: "center", flexWrap: "wrap" },
  detailTopBar: { display: "flex", justifyContent: "space-between", marginBottom: 16, position: "relative" },
  iconBtn: { width: 34, height: 34, borderRadius: 8, background: "#F7F8F2", border: "1px solid #DCE1D2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  menu: { position: "absolute", top: 46, right: 20, background: "#F7F8F2", border: "1px solid #DCE1D2", borderRadius: 10, overflow: "hidden", zIndex: 10, boxShadow: "0 8px 20px rgba(31,42,34,0.12)" },
  menuItem: { display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: 13, background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer", color: "#1F2A22" },
  detailHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18, position: "relative" },
  detailIconWrap: { width: 48, height: 48, borderRadius: 12, background: "#E4E9D9", display: "flex", alignItems: "center", justifyContent: "center" },
  detailTitle: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 600 },
  statsRow: { display: "flex", gap: 10, marginBottom: 16, position: "relative" },
  statBox: { flex: 1, background: "#F7F8F2", border: "1px solid #DCE1D2", borderRadius: 10, padding: "12px 8px", textAlign: "center" },
  statNum: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 19, fontWeight: 700, color: "#4B6B4E" },
  statLabel: { fontSize: 10, color: "#6E7A67", marginTop: 2 },
  card2: { background: "#F7F8F2", border: "1px solid #DCE1D2", borderRadius: 12, padding: 16, marginBottom: 12, position: "relative" },
  cardLabel: { fontSize: 12.5, fontWeight: 600, color: "#54604F", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" },
  cardHint: { fontSize: 12, color: "#8A9080", marginBottom: 10, lineHeight: 1.5 },
  sentence: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 13.5, lineHeight: 1.6, color: "#1F2A22" },
  plainText: { fontSize: 13.5, lineHeight: 1.5, color: "#3A4438" },
  bigCheckBtn: { width: "100%", background: "transparent", border: "1.5px solid #4B6B4E", color: "#4B6B4E", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" },
  bigCheckBtnDone: { background: "#4B6B4E", color: "#F4F6EF" },
  progressRow: { display: "flex", alignItems: "center", marginBottom: 20, position: "relative" },
  progressItem: { display: "flex", alignItems: "center", flex: 1 },
  progressDot: { width: 20, height: 20, borderRadius: "50%", background: "#E4E9D9", border: "1px solid #C9CFC0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "#8A9080", flexShrink: 0 },
  progressDotActive: { background: "#4B6B4E", border: "1px solid #4B6B4E", color: "#F4F6EF" },
  progressLine: { flex: 1, height: 1, background: "#C9CFC0" },
  templateGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  templateChip: { display: "flex", alignItems: "center", gap: 6, background: "#EEF1EA", border: "1px solid #DCE1D2", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#3A4438", cursor: "pointer" },
  divider: { textAlign: "center", fontSize: 11, color: "#8A9080", margin: "4px 0 16px", borderTop: "1px solid #DCE1D2", paddingTop: 12 },
  optional: { fontSize: 11, fontWeight: 400, color: "#8A9080", textTransform: "none" },
  optionRow: { width: "100%", background: "#EEF1EA", border: "1px solid #DCE1D2", borderRadius: 8, padding: "12px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left" },
  optionRowActive: { border: "1.5px solid #4B6B4E", background: "#E4E9D9" },
  input: { width: "100%", background: "#FFFFFF", border: "1px solid #C9CFC0", borderRadius: 8, padding: "11px 13px", color: "#1F2A22", fontSize: 13.5, boxSizing: "border-box", marginTop: 4 },
  textarea: { width: "100%", background: "#FFFFFF", border: "1px solid #C9CFC0", borderRadius: 8, padding: "11px 13px", color: "#1F2A22", fontSize: 13.5, boxSizing: "border-box", resize: "none", fontFamily: "inherit" },
  warnBox: { marginTop: 10, fontSize: 12, color: "#B4633B", background: "#F5E9DE", border: "1px solid #E5C7AE", borderRadius: 8, padding: "10px 12px", lineHeight: 1.5 },
  evidenceNote: { marginTop: 16, fontSize: 11.5, color: "#8A9080", lineHeight: 1.5, borderTop: "1px solid #DCE1D2", paddingTop: 12 },
  footer: { display: "flex", gap: 10, position: "relative" },
  backBtn: { background: "transparent", border: "1px solid #C9CFC0", color: "#54604F", borderRadius: 8, padding: "13px 20px", fontSize: 13.5, cursor: "pointer", fontWeight: 600 },
  nextBtn: { flex: 1, background: "#4B6B4E", border: "none", color: "#F4F6EF", borderRadius: 8, padding: "13px 20px", fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" },
  nextBtnDisabled: { background: "#C9CFC0", color: "#8A9080", cursor: "not-allowed" },
};
