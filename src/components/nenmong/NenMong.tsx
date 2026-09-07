/**
 * Nền Móng — UI island. Direct translation of docs/reference/nen-mong-v0.jsx
 * to strict TSX (§7.4). Mechanics, copy and structure are unchanged; the only
 * addition is the §5 language selector and per-language load/save.
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { LANGS, LANG_BY_ID, type LangId } from "../../data/nenmong/index";
import type { Drill, Grade } from "../../lib/nenmong/types";
import {
  DAILY_BATCH,
  addDays,
  applyBuild,
  applyGate,
  applySurvey,
  bumpStreak,
  defaultState,
  freshNode,
  todayStr,
  type AppState,
  type NodeState,
} from "../../lib/nenmong/engine";
import { clearState, loadLang, loadState, saveLang, saveState } from "../../lib/nenmong/storage";
import "./nen-mong.css";

type Mode = "gate" | "survey" | "build";
type Tab = "home" | "map" | "log";

/* ---------- seal (井 — giếng) ---------- */
function Seal({ size = 56, cracked = false, ghost = false }: { size?: number; cracked?: boolean; ghost?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g transform="rotate(-4 32 32)">
        <rect x="3" y="3" width="58" height="58" rx="7" fill={ghost ? "none" : "#B13125"}
          stroke={ghost ? "#B13125" : "none"} strokeWidth={ghost ? 2.5 : 0} opacity={ghost ? 0.55 : 0.94} />
        <g stroke={ghost ? "#B13125" : "#F6EFDF"} strokeWidth="5" strokeLinecap="round" fill="none" opacity={ghost ? 0.55 : 1}>
          <path d="M13 24.5 H51.5" />
          <path d="M12.5 41 H51" />
          <path d="M24.5 12.5 V52" />
          <path d="M41 12 V51.5" />
        </g>
        {cracked && (
          <path d="M8 14 L26 30 L20 38 L40 52" stroke="#F2EADA" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
      </g>
    </svg>
  );
}

function CodeBlock({ code, tone }: { code: string; tone?: string }) {
  return <pre className={"nm-code " + (tone || "")}>{code}</pre>;
}

/* ---------- drill card ---------- */
function Card({
  item, node, mode, onGrade, gateNo, levels,
}: {
  item: Drill;
  node: NodeState;
  mode: Mode;
  onGrade: (g: Grade, code: string, secs: number) => void;
  gateNo?: number;
  levels: string[];
}) {
  const [code, setCode] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [surrendered, setSurrendered] = useState(false);
  const [secs, setSecs] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (revealed) return;
    const t = setInterval(() => setSecs(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [revealed]);

  const prompt = useMemo(() => {
    if (item.v && item.v.length > 0) {
      const k = node.at % (item.v.length + 1);
      if (k > 0) return item.v[k - 1];
    }
    return item.p;
  }, [item, node.at]);

  const modeLabel =
    mode === "gate" ? "Nghiệm thu" : mode === "survey" ? "Khảo sát" : node.at > 0 || node.cr ? "Xây lại" : "Xây mới";

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const s = el.selectionStart, t = el.selectionEnd;
      const nv = code.slice(0, s) + "    " + code.slice(t);
      setCode(nv);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4; });
    }
  };

  const finish = (g: Grade) => onGrade(g, code, Math.floor((Date.now() - startRef.current) / 1000));

  return (
    <div className="nm-sheet">
      <div className="nm-sheetHead">
        <span className={"nm-tag " + (mode === "gate" ? "nm-tagSon" : "")}>{modeLabel}{mode === "gate" && gateNo ? " · lần " + gateNo : ""}</span>
        <span className="nm-lvl">{levels[item.lv]}</span>
        <span className="nm-timer">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>
      </div>

      <h2 className="nm-dtitle">{item.t}</h2>
      <p className="nm-dprompt">{prompt}</p>
      {item.pc && <CodeBlock code={item.pc} tone="nm-promptcode" />}

      <textarea
        className="nm-editor"
        rows={Math.max(4, (item.a.match(/\n/g) || []).length + 2)}
        placeholder="— tờ giấy trắng —"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        disabled={revealed}
      />

      {!revealed && (
        <div className="nm-row">
          <button className="nm-btn nm-primary" onClick={() => setRevealed(true)}>Đối chiếu đáp án</button>
          {mode === "gate" && (
            <button className="nm-btn nm-linky" onClick={() => { setSurrendered(true); setRevealed(true); }}>
              Không nhớ — mở đáp án
            </button>
          )}
        </div>
      )}

      {revealed && (
        <div className="nm-reveal">
          <div className="nm-anslabel">Đáp án idiomatic</div>
          <CodeBlock code={item.a} tone="nm-answer" />
          {item.n && <p className="nm-note">{item.n}</p>}
          {node.lastMissCode && (
            <div className="nm-prevmiss">
              <div className="nm-anslabel">Lần trước bạn viết</div>
              <CodeBlock code={node.lastMissCode} tone="nm-old" />
            </div>
          )}

          {surrendered ? (
            <div className="nm-row">
              <button className="nm-btn nm-son" onClick={() => finish("sai")}>Đã xem — khối quay về Chưa xây</button>
            </div>
          ) : (
            <div>
              <p className="nm-gradehint">
                Đúng = viết trọn từ trí nhớ, không ngập ngừng. Lệch = chạy được nhưng chưa idiomatic hoặc còn mò. Sai = không viết được.
              </p>
              <div className="nm-row">
                <button className="nm-btn nm-primary" onClick={() => finish("dung")}>Đúng</button>
                <button className="nm-btn" onClick={() => finish("lech")}>Lệch</button>
                <button className="nm-btn nm-sonline" onClick={() => finish("sai")}>Sai</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- map square ---------- */
function NodeSquare({ node, selected, onClick, title }: { node: NodeState; selected: boolean; onClick: () => void; title: string }) {
  let cls = "nm-sq";
  if (node.st === "u") cls += node.cr ? " nm-sqCr" : " nm-sqU";
  else if (node.st === "b") cls += " nm-sqB";
  else cls += " nm-sqS";
  if (selected) cls += " nm-sqSel";
  return <button className={cls} onClick={onClick} title={title} aria-label={title} />;
}

/* ============================================================ */
export default function NenMong() {
  const [lang, setLang] = useState<LangId>(() => loadLang());
  /* State is stored WITH the language it belongs to. `lang` changes during
     render while the load is still pending, so a bare AppState would briefly
     be indexed with the new deck's ids and blow up. Pairing them makes the
     mismatch representable, and `st` is simply null until they agree. */
  const [snap, setSnap] = useState<{ lang: LangId; st: AppState } | null>(null);
  const st = snap && snap.lang === lang ? snap.st : null;
  const [tab, setTab] = useState<Tab>("home");
  const [survey, setSurvey] = useState(false);
  const [surveySkip, setSurveySkip] = useState<string[]>([]);
  const [stamp, setStamp] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [overBatch, setOverBatch] = useState(false);
  const [buildOverride, setBuildOverride] = useState<string | null>(null);
  const [saveWarn, setSaveWarn] = useState(false);
  const [wipeArm, setWipeArm] = useState(false);
  const today = todayStr();

  const langDef = LANG_BY_ID[lang];
  const DECK = langDef.deck;
  const LEVELS = langDef.levels;
  const DECK_BY_ID = useMemo(() => Object.fromEntries(DECK.map((d) => [d.id, d])) as Record<string, Drill>, [DECK]);

  /* load this language's state; merge in any new deck ids; reset the day */
  useEffect(() => {
    let alive = true;
    loadState(lang).then((loaded) => {
      if (!alive) return;
      const base: AppState = loaded || defaultState(DECK);
      let merged = false;
      DECK.forEach((d) => {
        if (!base.nodes[d.id]) { base.nodes[d.id] = freshNode(); merged = true; }
      });
      if (base.lastBuildDate !== todayStr()) {
        base.lastBuildDate = todayStr();
        base.buildsToday = 0;
        merged = true;
      }
      setSnap({ lang, st: base });
      // Write the merge back so stored state matches what is on screen. Without
      // this it only landed on the next grade, so after a deck update storage
      // still listed the old block count. Only when something actually changed,
      // and only for state that already exists — browsing a language you have
      // never practised still creates no key.
      if (loaded && merged) void saveState(lang, base);
    });
    return () => { alive = false; };
  }, [lang, DECK]);

  const mutate = (fn: (n: AppState) => void) => {
    setSnap((prev) => {
      if (!prev || prev.lang !== lang) return prev;
      const n: AppState = JSON.parse(JSON.stringify(prev.st));
      fn(n);
      saveState(lang, n).then((ok) => { if (!ok) setSaveWarn(true); });
      return { lang, st: n };
    });
  };

  const dueQueue = useMemo(() => {
    if (!st) return [];
    return DECK.filter((d) => {
      const n = st.nodes[d.id];
      return n && (n.st === "b" || n.st === "s") && n.due && n.due <= today;
    }).sort((a, b) => (st.nodes[a.id].due! < st.nodes[b.id].due! ? -1 : 1));
  }, [st, today, DECK]);

  const unbuilt = useMemo(() => (st ? DECK.filter((d) => st.nodes[d.id].st === "u") : []), [st, DECK]);
  const surveyList = useMemo(() => unbuilt.filter((d) => !surveySkip.includes(d.id)), [unbuilt, surveySkip]);
  const sealedCount = st ? DECK.filter((d) => st.nodes[d.id].st === "s").length : 0;
  const builtCount = st ? DECK.filter((d) => st.nodes[d.id].st === "b").length : 0;

  const buildTarget = useMemo(() => {
    if (!st) return null;
    if (buildOverride && st.nodes[buildOverride] && st.nodes[buildOverride].st === "u") return DECK_BY_ID[buildOverride];
    return unbuilt[0] || null;
  }, [st, unbuilt, buildOverride, DECK_BY_ID]);

  const switchLang = (next: LangId) => {
    if (next === lang) return;
    saveLang(next);
    setLang(next);
    // transient UI refers to the old deck's ids
    setSurvey(false); setSurveySkip([]); setSelId(null);
    setBuildOverride(null); setOverBatch(false); setWipeArm(false); setTab("home");
  };

  if (!st) {
    return (
      <div className="nm-root">
        <div className="nm-loading">đang mở sổ…</div>
      </div>
    );
  }

  const gradeGate = (id: string, g: Grade, code: string, secs: number) => {
    mutate((n) => {
      const r = applyGate(n.nodes[id], g, today, { id, code, secs });
      n.nodes[id] = r.node;
      if (r.journal) n.journal.unshift(r.journal);
      const remaining = DECK.filter((d) => {
        const x = n.nodes[d.id];
        return (x.st === "b" || x.st === "s") && x.due && x.due <= today;
      }).length;
      if (remaining === 0) n.streak = bumpStreak(n.streak, today);
    });
    if (g === "dung") { setStamp(true); setTimeout(() => setStamp(false), 1050); }
  };

  const gradeBuild = (id: string, g: Grade, code: string, secs: number) => {
    mutate((n) => {
      const r = applyBuild(n.nodes[id], g, today, { id, code, secs });
      n.nodes[id] = r.node;
      if (r.journal) n.journal.unshift(r.journal);
      if (n.lastBuildDate !== today) { n.lastBuildDate = today; n.buildsToday = 0; }
      n.buildsToday += 1;
    });
    if (buildOverride === id) setBuildOverride(null);
  };

  const gradeSurvey = (id: string, g: Grade, _code: string, _secs: number) => {
    mutate((n) => { n.nodes[id] = applySurvey(n.nodes[id], g, today).node; });
    if (g !== "dung") setSurveySkip((s) => [...s, id]);
    if (surveyList.length <= 1) {
      setSurvey(false);
      mutate((n) => { n.surveyDone = true; });
    }
  };

  const wipe = () => {
    clearState(lang).then(() => {
      const fresh = defaultState(DECK);
      setSnap({ lang, st: fresh });
      setWipeArm(false);
      setSurveySkip([]);
      saveState(lang, fresh);
    });
  };

  /* ---------- render ---------- */
  const gateItem = dueQueue[0] || null;
  const showSurveyOffer = !survey && !st.surveyDone && dueQueue.length === 0 && unbuilt.length > 0 && !buildOverride;

  return (
    <div className="nm-root">
      {stamp && (
        <div className="nm-stampwrap"><div className="nm-stampin"><Seal size={132} /></div></div>
      )}

      <header className="nm-head">
        <div className="nm-brand">
          <Seal size={34} ghost />
          <div>
            <div className="nm-brandTitle">Nền Móng</div>
            <div className="nm-brandSub">luyện khối nhỏ · DSA · {langDef.label}</div>
          </div>
        </div>
        <div className="nm-headRight">
          <div className="nm-date">{today}</div>
          {st.streak.n > 0 && <div className="nm-streak">chuỗi {st.streak.n} ngày</div>}
          <select
            className="nm-lang"
            value={lang}
            aria-label="Ngôn ngữ"
            onChange={(e) => switchLang(e.target.value as LangId)}
          >
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>
      </header>

      {saveWarn && <div className="nm-warn">Lưu ý: không lưu được dữ liệu — tiến độ chỉ tồn tại trong phiên này.</div>}

      <nav className="nm-tabs">
        {([["home", "Hôm nay"], ["map", "Bản đồ"], ["log", "Nhật ký"]] as [Tab, string][]).map(([k, label]) => (
          <button key={k} className={"nm-tab " + (tab === k ? "nm-tabOn" : "")} onClick={() => { setTab(k); setSelId(null); }}>
            {label}
            {k === "home" && dueQueue.length > 0 && <span className="nm-dot" />}
          </button>
        ))}
      </nav>

      {tab === "home" && (
        <main>
          <div className="nm-stats">
            <div className={"nm-stat " + (dueQueue.length > 0 ? "nm-statSon" : "")}>
              <div className="nm-statN">{dueQueue.length}</div><div className="nm-statL">đến hạn</div>
            </div>
            <div className="nm-stat"><div className="nm-statN">{builtCount}</div><div className="nm-statL">đã xây</div></div>
            <div className="nm-stat"><div className="nm-statN">{sealedCount}</div><div className="nm-statL">nghiệm thu</div></div>
          </div>

          {gateItem && !survey && (
            <div>
              <p className="nm-lockline">Cổng đóng với khối mới: nghiệm thu trước, xây sau.</p>
              <Card
                key={"g-" + gateItem.id + "-" + st.nodes[gateItem.id].at}
                item={gateItem}
                node={st.nodes[gateItem.id]}
                mode="gate"
                gateNo={st.nodes[gateItem.id].iv + 1}
                levels={LEVELS}
                onGrade={(g, c, s) => gradeGate(gateItem.id, g, c, s)}
              />
            </div>
          )}

          {!gateItem && survey && surveyList[0] && (
            <div>
              <p className="nm-lockline">
                Khảo sát: thử lạnh từng khối. Đúng thì khỏi xây — hẹn nghiệm thu sau 2 ngày.
                Còn {surveyList.length} khối.{" "}
                <button className="nm-btn nm-linky" onClick={() => { setSurvey(false); mutate((n) => { n.surveyDone = true; }); }}>Dừng khảo sát</button>
              </p>
              <Card
                key={"s-" + surveyList[0].id}
                item={surveyList[0]}
                node={st.nodes[surveyList[0].id]}
                mode="survey"
                levels={LEVELS}
                onGrade={(g, c, s) => gradeSurvey(surveyList[0]!.id, g, c, s)}
              />
            </div>
          )}

          {!gateItem && !survey && showSurveyOffer && (
            <div className="nm-sheet nm-intro">
              <h2 className="nm-dtitle">Khảo sát nhanh</h2>
              <p className="nm-dprompt">
                Trước khi xây, thử lạnh từng khối. Khối nào bạn viết trọn từ trí nhớ thì khỏi phải xây —
                nó vào thẳng lịch nghiệm thu. Khối nào chưa thì để lại xây sau. Với người đã có nghề,
                đây là cách trung thực nhất để biết Nền có phải nút thắt của mình hay không.
              </p>
              <div className="nm-row">
                <button className="nm-btn nm-primary" onClick={() => { setSurvey(true); setSurveySkip([]); }}>Bắt đầu khảo sát</button>
                <button className="nm-btn" onClick={() => mutate((n) => { n.surveyDone = true; })}>Bỏ qua — xây từ đầu</button>
              </div>
            </div>
          )}

          {!gateItem && !survey && !showSurveyOffer && buildTarget && (
            <div>
              {st.buildsToday >= DAILY_BATCH && !overBatch ? (
                <div className="nm-sheet nm-intro">
                  <p className="nm-dprompt">
                    Đủ khẩu phần {DAILY_BATCH} khối hôm nay. Bê tông cứng qua đêm, không cứng trong một buổi.
                  </p>
                  <div className="nm-row">
                    <button className="nm-btn" onClick={() => setOverBatch(true)}>Vẫn xây thêm</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="nm-lockline">
                    Xây {st.buildsToday + 1}/{DAILY_BATCH} hôm nay · còn {unbuilt.length} khối chưa xây
                  </p>
                  <Card
                    key={"b-" + buildTarget.id + "-" + st.nodes[buildTarget.id].at}
                    item={buildTarget}
                    node={st.nodes[buildTarget.id]}
                    mode="build"
                    levels={LEVELS}
                    onGrade={(g, c, s) => gradeBuild(buildTarget.id, g, c, s)}
                  />
                </div>
              )}
            </div>
          )}

          {!gateItem && !survey && !buildTarget && (
            <div className="nm-sheet nm-intro nm-done">
              <Seal size={64} />
              <h2 className="nm-dtitle" style={{ marginTop: 14 }}>Hết việc hôm nay</h2>
              <p className="nm-dprompt">
                Đào nhi bất tuyệt — mai nghiệm thu tiếp.
                {(() => {
                  const next = DECK.map((d) => st.nodes[d.id].due).filter(Boolean).sort()[0];
                  return next ? " Cổng gần nhất: " + next + "." : "";
                })()}
              </p>
            </div>
          )}
        </main>
      )}

      {tab === "map" && (
        <main>
          {unbuilt.length > 0 && dueQueue.length === 0 && st.surveyDone && (
            <p className="nm-lockline">
              Còn {unbuilt.length} khối chưa xây.{" "}
              <button className="nm-btn nm-linky" onClick={() => { setSurveySkip([]); setSurvey(true); setTab("home"); }}>
                Khảo sát các khối còn lại
              </button>
            </p>
          )}
          {LEVELS.map((name, lv) => (
            <div className="nm-mapRow" key={lv}>
              <div className="nm-mapLabel">{name}</div>
              <div className="nm-mapSquares">
                {DECK.filter((d) => d.lv === lv).map((d) => (
                  <NodeSquare
                    key={d.id}
                    node={st.nodes[d.id]}
                    selected={selId === d.id}
                    title={d.t}
                    onClick={() => setSelId(selId === d.id ? null : d.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="nm-legend">
            <span><i className="nm-sq nm-sqU nm-demo" /> chưa xây</span>
            <span><i className="nm-sq nm-sqB nm-demo" /> đã xây</span>
            <span><i className="nm-sq nm-sqS nm-demo" /> nghiệm thu</span>
            <span><i className="nm-sq nm-sqCr nm-demo" /> nứt (rớt cổng)</span>
          </div>

          {selId && (() => {
            const d = DECK_BY_ID[selId];
            const nd = st.nodes[selId];
            if (!d || !nd) return null;
            const stText = nd.st === "u" ? (nd.cr ? "Chưa xây (từng nứt)" : "Chưa xây")
              : nd.st === "b" ? "Đã xây — chờ nghiệm thu" : "Đã nghiệm thu";
            return (
              <div className="nm-sheet nm-detail">
                <div className="nm-sheetHead">
                  <span className="nm-tag">{stText}</span>
                  <span className="nm-lvl">{LEVELS[d.lv]}</span>
                </div>
                <h2 className="nm-dtitle">{d.t}</h2>
                <p className="nm-metaLine">
                  {nd.due ? "Cổng kế: " + nd.due + " · " : ""}lượt: {nd.at} · trượt: {nd.miss}
                </p>
                {nd.st === "u" && dueQueue.length === 0 && (
                  <div className="nm-row">
                    <button className="nm-btn nm-primary" onClick={() => { setBuildOverride(d.id); setTab("home"); }}>
                      Xây khối này
                    </button>
                  </div>
                )}
                {nd.st === "u" && dueQueue.length > 0 && (
                  <p className="nm-note">Còn {dueQueue.length} cổng đến hạn — nghiệm thu xong mới xây được.</p>
                )}
              </div>
            );
          })()}
        </main>
      )}

      {tab === "log" && (
        <main>
          {st.journal.length === 0 && (
            <div className="nm-sheet nm-intro"><p className="nm-dprompt">Chưa có vết trượt nào. Nhật ký chỉ ghi khi bạn tự chấm Lệch hoặc Sai — vết trượt của chính mình đáng giá hơn mọi bộ đề dựng sẵn.</p></div>
          )}
          {st.journal.map((e, i) => {
            const d = DECK_BY_ID[e.id];
            if (!d) return null;
            return (
              <div className="nm-sheet nm-logEntry" key={i}>
                <div className="nm-sheetHead">
                  <span className={"nm-tag " + (e.g === "sai" ? "nm-tagSon" : "")}>{e.g === "sai" ? "Sai" : "Lệch"}</span>
                  <span className="nm-lvl">{d.t}</span>
                  <span className="nm-timer">{e.d}</span>
                </div>
                {e.code && e.code.trim() ? <CodeBlock code={e.code} tone="nm-old" /> : <p className="nm-note">(bỏ trống)</p>}
                <details className="nm-ansdetails">
                  <summary>Đáp án</summary>
                  <CodeBlock code={d.a} tone="nm-answer" />
                </details>
              </div>
            );
          })}

          <div className="nm-wipeRow">
            {!wipeArm ? (
              <button className="nm-btn nm-linky" onClick={() => setWipeArm(true)}>Xoá dữ liệu ngôn ngữ này</button>
            ) : (
              <span>
                <span className="nm-note">Chắc chắn? Toàn bộ tiến độ sẽ mất. </span>
                <button className="nm-btn nm-son" onClick={wipe}>Xoá</button>{" "}
                <button className="nm-btn" onClick={() => setWipeArm(false)}>Thôi</button>
              </span>
            )}
          </div>
        </main>
      )}

      <footer className="nm-foot">Bạn xây. Công cụ chỉ nghiệm thu. — v0</footer>
    </div>
  );
}
