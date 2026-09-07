import { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   NỀN MÓNG — luyện khối nhỏ mỗi ngày (DSA · Python)
   Bạn xây. Công cụ chỉ nghiệm thu.
   Storage adapter: claude artifact storage (window.storage).
   Port sang Astro: thay loadState/saveState/clearState bằng localStorage.
   ============================================================ */

const KEY = "nenmong-v1";
const INTERVALS = [1, 2, 4, 7, 14, 30];
const DAILY_BATCH = 6;

const LEVELS = [
  "Móng — cơ chế",
  "Nền 1 — Vòng lặp",
  "Nền 2 — Chuỗi",
  "Nền 3 — List",
  "Nền 4 — Dict · Set",
  "Nền 5 — Idiom LeetCode",
];

/* ---------- DECK ----------
   id, lv (0..5), t: tên khối, p: đề bài, pc: code kèm đề (tuỳ chọn),
   a: đáp án idiomatic, n: ghi chú/bẫy (tuỳ chọn), v: [biến thể đề] (tuỳ chọn)
*/
const DECK = [
  // ===== Tầng 1 — MÓNG =====
  {
    id: "m-invariant", lv: 0, t: "Bất biến vòng lặp",
    p: "Viết một–hai câu: 'bất biến' của binary search là gì? (Điều gì luôn đúng về đoạn [lo, hi] sau mỗi vòng lặp?)",
    a: "Nếu target có trong mảng thì nó luôn nằm trong đoạn [lo, hi].\nMọi phần tử bên trái lo đều < target, mọi phần tử bên phải hi đều > target.\nVòng lặp kết thúc khi lo > hi (đoạn rỗng).",
    n: "Two pointers, sliding window, binary search — tất cả đều là: phát biểu một bất biến, rồi giữ nó đúng sau mỗi bước.",
  },
  {
    id: "m-alias", lv: 0, t: "Tham chiếu, không phải bản sao",
    p: "Dự đoán output, rồi giải thích một câu:",
    pc: "a = [1, 2, 3]\nb = a\nb.append(4)\nprint(a)",
    a: "[1, 2, 3, 4]\n# b = a KHÔNG sao chép — hai tên cùng trỏ một list.\n# Muốn bản sao nông: b = a[:]  hoặc  b = list(a)",
  },
  {
    id: "m-matrix", lv: 0, t: "Bẫy nhân list",
    p: "Dự đoán output, rồi giải thích vì sao:",
    pc: "m = [[0] * 3] * 2\nm[0][0] = 9\nprint(m)",
    a: "[[9, 0, 0], [9, 0, 0]]\n# * 2 sao chép THAM CHIẾU đến cùng một hàng, không tạo hàng mới.\n# Cách đúng: m = [[0] * 3 for _ in range(2)]",
  },
  {
    id: "m-bigo", lv: 0, t: "Đếm phép toán → Big-O",
    p: "Thân vòng lặp trong chạy tổng cộng bao nhiêu lần? Suy ra Big-O:",
    pc: "for i in range(n):\n    for j in range(i + 1, n):\n        ...",
    a: "(n-1) + (n-2) + ... + 1 = n(n-1)/2  →  O(n²)",
    n: "Big-O là kết quả của việc ĐẾM, không phải bảng để thuộc lòng.",
  },
  {
    id: "m-recur", lv: 0, t: "Đệ quy = ngăn xếp",
    p: "f(3) in ra gì? Giải thích thứ tự bằng một câu:",
    pc: "def f(n):\n    if n == 0:\n        return\n    f(n - 1)\n    print(n)",
    a: "In: 1, 2, 3 (mỗi số một dòng)\n# print nằm SAU lời gọi đệ quy nên chạy lúc ngăn xếp bung ra —\n# lời gọi sâu nhất in trước.",
  },
  {
    id: "m-array", lv: 0, t: "Vì sao mảng truy cập O(1)",
    p: "Trả lời hai ý, mỗi ý một câu: vì sao nums[i] là O(1), còn (x in nums) là O(n)?",
    a: "nums[i]: máy tính địa_chỉ = gốc + i × kích_thước_ô — nhảy thẳng, không duyệt.\nx in nums: phải so sánh lần lượt từng phần tử vì không biết x nằm đâu.",
  },

  // ===== Nền 1 — Vòng lặp =====
  {
    id: "l1-enum", lv: 1, t: "enumerate",
    p: "Viết dòng for duyệt nums, mỗi vòng lấy cả chỉ số i và giá trị x.",
    v: ["Duyệt nums sao cho trong thân vòng lặp có sẵn cả vị trí lẫn phần tử — một dòng for."],
    a: "for i, x in enumerate(nums):",
  },
  {
    id: "l1-rev", lv: 1, t: "Duyệt ngược",
    p: "Viết dòng for duyệt chỉ số của nums từ cuối về đầu.",
    a: "for i in range(len(nums) - 1, -1, -1):",
    n: "Không cần chỉ số thì gọn hơn: for x in reversed(nums):",
  },
  {
    id: "l1-zip", lv: 1, t: "zip",
    p: "Viết dòng for duyệt hai list a và b theo từng cặp phần tử (x, y).",
    a: "for x, y in zip(a, b):",
    n: "zip dừng ở list ngắn hơn.",
  },
  {
    id: "l1-bs", lv: 1, t: "Khung binary search",
    p: "Viết thân hàm binary search trên nums đã sắp xếp: trả về chỉ số của target, không có thì trả -1.",
    a: "lo, hi = 0, len(nums) - 1\nwhile lo <= hi:\n    mid = (lo + hi) // 2\n    if nums[mid] == target:\n        return mid\n    if nums[mid] < target:\n        lo = mid + 1\n    else:\n        hi = mid - 1\nreturn -1",
    n: "Khối Móng liên quan: 'Bất biến vòng lặp'. Viết được khung mà không phát biểu được bất biến thì mới thuộc, chưa hiểu.",
  },
  {
    id: "l1-forelse", lv: 1, t: "for–else",
    p: "Duyệt nums tìm target, break khi thấy; nếu duyệt hết mà KHÔNG thấy thì in 'khong co'. Không dùng biến cờ found.",
    a: "for x in nums:\n    if x == target:\n        break\nelse:\n    print('khong co')",
    n: "else của for chỉ chạy khi vòng lặp kết thúc tự nhiên (không break).",
  },
  {
    id: "l1-tern", lv: 1, t: "Ternary",
    p: "Một dòng: gán nhan = 'chan' nếu x chẵn, ngược lại 'le'.",
    a: "nhan = 'chan' if x % 2 == 0 else 'le'",
  },
  {
    id: "l1-chain", lv: 1, t: "So sánh chuỗi hoá",
    p: "Viết một điều kiện kiểm tra 0 ≤ i < n theo kiểu Python, không dùng and.",
    a: "if 0 <= i < n:",
    n: "Chained comparison — dùng liên tục khi kiểm tra biên lưới.",
  },

  // ===== Nền 2 — Chuỗi =====
  {
    id: "l2-revs", lv: 2, t: "Đảo chuỗi",
    p: "Một biểu thức: đảo ngược chuỗi s.",
    v: ["Viết biểu thức trả về chuỗi s theo thứ tự ký tự ngược lại."],
    a: "s[::-1]",
  },
  {
    id: "l2-pal", lv: 2, t: "Palindrome",
    p: "Một biểu thức boolean: s có phải palindrome không?",
    a: "s == s[::-1]",
  },
  {
    id: "l2-splitjoin", lv: 2, t: "split / join",
    p: "Hai dòng: tách câu s thành list các từ; rồi nối list words thành một chuỗi, các từ cách nhau bởi dấu '-'.",
    v: ["Hai dòng: từ chuỗi s lấy ra list từ; từ list words ghép lại thành chuỗi dùng '-' làm chất nối."],
    a: "words = s.split()\nkq = '-'.join(words)",
    n: "split() không tham số: tách theo mọi khoảng trắng và tự bỏ chuỗi rỗng.",
  },
  {
    id: "l2-build", lv: 2, t: "Xây chuỗi hiệu quả",
    p: "Ghép nhiều mảnh chuỗi sinh ra trong vòng lặp thành một chuỗi — viết cách đúng về hiệu năng (ví dụ: nối str(x) của từng x trong nums).",
    a: "parts = []\nfor x in nums:\n    parts.append(str(x))\nkq = ''.join(parts)",
    n: "Cộng chuỗi bằng += trong vòng lặp là O(n²) vì chuỗi bất biến — mỗi lần cộng là một lần sao chép.",
  },
  {
    id: "l2-chars", lv: 2, t: "Phân loại ký tự",
    p: "Ba biểu thức: c là chữ cái? c là chữ số? c là chữ-hoặc-số?",
    a: "c.isalpha()\nc.isdigit()\nc.isalnum()",
  },
  {
    id: "l2-ord", lv: 2, t: "ord / chr",
    p: "Hai dòng: tính chỉ số 0–25 của chữ thường c trong bảng chữ cái; và lấy ký tự thứ k (0-based) của bảng chữ thường.",
    a: "i = ord(c) - ord('a')\nch = chr(ord('a') + k)",
  },
  {
    id: "l2-clean", lv: 2, t: "Chuẩn hoá chuỗi",
    p: "Một biểu thức: s sau khi bỏ khoảng trắng hai đầu và chuyển về chữ thường.",
    a: "s.strip().lower()",
  },

  // ===== Nền 3 — List =====
  {
    id: "l3-slice", lv: 3, t: "Slice cơ bản",
    p: "Ba biểu thức: 3 phần tử đầu của a; 3 phần tử cuối; bản sao nông của a.",
    a: "a[:3]\na[-3:]\na[:]",
  },
  {
    id: "l3-comp", lv: 3, t: "List comprehension",
    p: "Một dòng: list bình phương của các số chẵn trong nums.",
    v: ["Một dòng: từ nums tạo list mới gồm x*x với mọi x chẵn."],
    a: "[x * x for x in nums if x % 2 == 0]",
  },
  {
    id: "l3-sortkey", lv: 3, t: "sort với key",
    p: "Sắp xếp words theo độ dài giảm dần, tại chỗ.",
    v: ["Một dòng, sửa trực tiếp words: từ dài đứng trước, từ ngắn đứng sau."],
    a: "words.sort(key=len, reverse=True)",
    n: "sorted(words, ...) trả về list mới; .sort() sửa tại chỗ và trả về None.",
  },
  {
    id: "l3-sortmulti", lv: 3, t: "Khoá kép",
    p: "Sắp xếp list điểm pts (mỗi điểm là tuple (x, y)) theo x tăng dần, x bằng nhau thì y giảm dần.",
    a: "pts.sort(key=lambda p: (p[0], -p[1]))",
  },
  {
    id: "l3-maxidx", lv: 3, t: "Chỉ số của max",
    p: "Tìm chỉ số của phần tử lớn nhất trong nums (một dòng).",
    a: "i = nums.index(max(nums))",
    n: "Hai lần duyệt vẫn là O(n) — hoàn toàn ổn.",
  },
  {
    id: "l3-matrix", lv: 3, t: "Khởi tạo ma trận",
    p: "Tạo ma trận grid gồm m hàng × n cột toàn số 0 — đúng cách.",
    a: "grid = [[0] * n for _ in range(m)]",
    n: "Khối Móng liên quan: 'Bẫy nhân list' — [[0]*n]*m là m tham chiếu cùng một hàng.",
  },
  {
    id: "l3-prefix", lv: 3, t: "Prefix sum",
    p: "Xây mảng cộng dồn p của nums sao cho p[i] = tổng i phần tử đầu (p[0] = 0).",
    a: "p = [0]\nfor x in nums:\n    p.append(p[-1] + x)",
    n: "Tổng đoạn nums[l..r] = p[r+1] - p[l].",
  },
  {
    id: "l3-last", lv: 3, t: "Cuối list",
    p: "Ba thao tác: đọc phần tử cuối của a; thêm x vào cuối; bỏ phần tử cuối và lấy giá trị của nó.",
    a: "a[-1]\na.append(x)\nv = a.pop()",
  },

  // ===== Nền 4 — Dict · Set =====
  {
    id: "l4-count", lv: 4, t: "Đếm tần suất (dict thường)",
    p: "Đếm tần suất ký tự trong s bằng dict thường, không import gì.",
    v: ["Xây dict cnt: mỗi ký tự của s → số lần xuất hiện, chỉ dùng dict.get."],
    a: "cnt = {}\nfor c in s:\n    cnt[c] = cnt.get(c, 0) + 1",
  },
  {
    id: "l4-counter", lv: 4, t: "Counter & anagram",
    p: "Sau import: một dòng tạo Counter tần suất của s; và một biểu thức kiểm tra a, b là anagram của nhau.",
    a: "from collections import Counter\ncnt = Counter(s)\nCounter(a) == Counter(b)",
  },
  {
    id: "l4-dd", lv: 4, t: "defaultdict",
    p: "Gom các từ trong words theo chữ cái đầu: dict từ chữ cái → list từ. Dùng defaultdict.",
    a: "from collections import defaultdict\nd = defaultdict(list)\nfor w in words:\n    d[w[0]].append(w)",
  },
  {
    id: "l4-iter", lv: 4, t: "Duyệt dict",
    p: "Hai mảnh: dòng for duyệt dict d lấy cả key và value; điều kiện kiểm tra key k có trong d.",
    a: "for k, v in d.items():\nif k in d:",
  },
  {
    id: "l4-set", lv: 4, t: "Set thao tác",
    p: "Bốn thao tác: tạo set rỗng; thêm x; kiểm tra x có trong seen; lấy giao của hai set a, b.",
    v: ["Viết lần lượt: set rỗng tên seen; nạp x vào; biểu thức membership của x; biểu thức phần chung của a và b."],
    a: "seen = set()\nseen.add(x)\nx in seen\na & b",
    n: "set() chứ không phải {} — {} là dict rỗng.",
  },
  {
    id: "l4-hash", lv: 4, t: "Key phải hashable",
    p: "Muốn dùng một list các số lst làm key của dict d — viết cách đúng.",
    a: "d[tuple(lst)] = ...",
    n: "list không hashable; tuple thì có. Gặp nhiều trong group-anagrams, memo trạng thái.",
  },
  {
    id: "l4-common", lv: 4, t: "most_common",
    p: "Một dòng (sau khi đã import Counter): lấy phần tử xuất hiện nhiều nhất trong nums.",
    a: "Counter(nums).most_common(1)[0][0]",
  },

  // ===== Nền 5 — Idiom LeetCode =====
  {
    id: "l5-swap", lv: 5, t: "Hoán đổi & unpack",
    p: "Hai dòng: hoán đổi a và b không dùng biến tạm; tách nums thành first và phần còn lại rest.",
    a: "a, b = b, a\nfirst, *rest = nums",
  },
  {
    id: "l5-inf", lv: 5, t: "Vô cực",
    p: "Hai dòng: khởi tạo best = dương vô cực và worst = âm vô cực.",
    a: "best = float('inf')\nworst = float('-inf')",
  },
  {
    id: "l5-divmod", lv: 5, t: "Chia nguyên · dư · trần",
    p: "Hai dòng: lấy thương nguyên q và dư r của a chia b bằng một lệnh; chia lấy trần của a cho b không import math (a, b dương).",
    a: "q, r = divmod(a, b)\ntran = (a + b - 1) // b",
    n: "Hoặc -(-a // b). Nhớ: // của Python làm tròn về âm vô cực, khác C/Java.",
  },
  {
    id: "l5-deque", lv: 5, t: "deque cho BFS",
    p: "Ba dòng: tạo hàng đợi q chứa sẵn start; thêm x vào cuối; lấy phần tử đầu ra biến v.",
    v: ["Viết bộ ba thao tác hàng đợi BFS: khởi tạo với start, đẩy x vào đuôi, rút phần tử đầu thành v."],
    a: "from collections import deque\nq = deque([start])\nq.append(x)\nv = q.popleft()",
    n: "list.pop(0) là O(n) — không dùng cho BFS.",
  },
  {
    id: "l5-heap", lv: 5, t: "heapq min-heap",
    p: "Hai thao tác: đẩy cặp (dist, node) vào heap h; lấy ra cặp nhỏ nhất thành d, u.",
    a: "import heapq\nheapq.heappush(h, (dist, node))\nd, u = heapq.heappop(h)",
    n: "Max-heap: đẩy số âm vào, lấy ra thì đảo dấu lại.",
  },
  {
    id: "l5-cache", lv: 5, t: "Nhớ hoá đệ quy",
    p: "Thêm nhớ hoá cho hàm đệ quy f(n) bằng decorator (kèm dòng import).",
    a: "from functools import lru_cache\n\n@lru_cache(None)\ndef f(n):\n    ...",
    n: "Python 3.9+ có thể dùng @cache cho gọn.",
  },
  {
    id: "l5-dirs", lv: 5, t: "Duyệt 4 hướng lưới",
    p: "Từ ô (x, y): sinh 4 ô kề và lọc những ô nằm trong biên lưới m × n.",
    a: "for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n    nx, ny = x + dx, y + dy\n    if 0 <= nx < m and 0 <= ny < n:\n        ...",
  },
];

const DECK_BY_ID = Object.fromEntries(DECK.map((d) => [d.id, d]));

/* ---------- date utils ---------- */
function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
function addDays(s, n) {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  const p = (v) => String(v).padStart(2, "0");
  return dt.getFullYear() + "-" + p(dt.getMonth() + 1) + "-" + p(dt.getDate());
}

/* ---------- storage adapter ---------- */
async function loadState() {
  try {
    if (typeof window === "undefined" || !window.storage) return null;
    const r = await window.storage.get(KEY);
    return r && r.value ? JSON.parse(r.value) : null;
  } catch (e) {
    return null;
  }
}
async function saveState(s) {
  try {
    if (typeof window === "undefined" || !window.storage) return false;
    await window.storage.set(KEY, JSON.stringify(s));
    return true;
  } catch (e) {
    return false;
  }
}
async function clearState() {
  try {
    if (window.storage) await window.storage.delete(KEY);
  } catch (e) {}
}

function freshNode() {
  return { st: "u", iv: 0, due: null, at: 0, miss: 0, lastMissCode: null, cr: false };
}
function defaultState() {
  const nodes = {};
  DECK.forEach((d) => (nodes[d.id] = freshNode()));
  return {
    nodes,
    journal: [],
    streak: { n: 0, last: null },
    lastBuildDate: null,
    buildsToday: 0,
    surveyDone: false,
  };
}

/* ---------- seal (井 — giếng) ---------- */
function Seal({ size = 56, cracked = false, ghost = false }) {
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

function CodeBlock({ code, tone }) {
  return <pre className={"code " + (tone || "")}>{code}</pre>;
}

/* ---------- drill card ---------- */
function Card({ item, node, mode, onGrade, gateNo }) {
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

  const onKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.target;
      const s = el.selectionStart, t = el.selectionEnd;
      const nv = code.slice(0, s) + "    " + code.slice(t);
      setCode(nv);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 4; });
    }
  };

  const finish = (g) => onGrade(g, code, Math.floor((Date.now() - startRef.current) / 1000));

  return (
    <div className="sheet">
      <div className="sheetHead">
        <span className={"tag " + (mode === "gate" ? "tagSon" : "")}>{modeLabel}{mode === "gate" && gateNo ? " · lần " + gateNo : ""}</span>
        <span className="lvl">{LEVELS[item.lv]}</span>
        <span className="timer">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>
      </div>

      <h2 className="dtitle">{item.t}</h2>
      <p className="dprompt">{prompt}</p>
      {item.pc && <CodeBlock code={item.pc} tone="promptcode" />}

      <textarea
        className="editor"
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
        <div className="row">
          <button className="btn primary" onClick={() => setRevealed(true)}>Đối chiếu đáp án</button>
          {mode === "gate" && (
            <button className="btn linky" onClick={() => { setSurrendered(true); setRevealed(true); }}>
              Không nhớ — mở đáp án
            </button>
          )}
        </div>
      )}

      {revealed && (
        <div className="reveal">
          <div className="anslabel">Đáp án idiomatic</div>
          <CodeBlock code={item.a} tone="answer" />
          {item.n && <p className="note">{item.n}</p>}
          {node.lastMissCode && (
            <div className="prevmiss">
              <div className="anslabel">Lần trước bạn viết</div>
              <CodeBlock code={node.lastMissCode} tone="old" />
            </div>
          )}

          {surrendered ? (
            <div className="row">
              <button className="btn son" onClick={() => finish("sai")}>Đã xem — khối quay về Chưa xây</button>
            </div>
          ) : (
            <div>
              <p className="gradehint">
                Đúng = viết trọn từ trí nhớ, không ngập ngừng. Lệch = chạy được nhưng chưa idiomatic hoặc còn mò. Sai = không viết được.
              </p>
              <div className="row">
                <button className="btn primary" onClick={() => finish("dung")}>Đúng</button>
                <button className="btn" onClick={() => finish("lech")}>Lệch</button>
                <button className="btn sonline" onClick={() => finish("sai")}>Sai</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- map square ---------- */
function NodeSquare({ node, selected, onClick, title }) {
  let cls = "sq";
  if (node.st === "u") cls += node.cr ? " sqCr" : " sqU";
  else if (node.st === "b") cls += " sqB";
  else cls += " sqS";
  if (selected) cls += " sqSel";
  return <button className={cls} onClick={onClick} title={title} aria-label={title} />;
}

/* ============================================================ */
export default function App() {
  const [st, setSt] = useState(null);
  const [tab, setTab] = useState("home");
  const [survey, setSurvey] = useState(false);
  const [surveySkip, setSurveySkip] = useState([]);
  const [stamp, setStamp] = useState(false);
  const [selId, setSelId] = useState(null);
  const [overBatch, setOverBatch] = useState(false);
  const [buildOverride, setBuildOverride] = useState(null);
  const [saveWarn, setSaveWarn] = useState(false);
  const [wipeArm, setWipeArm] = useState(false);
  const today = todayStr();

  useEffect(() => {
    let alive = true;
    loadState().then((loaded) => {
      if (!alive) return;
      const base = loaded || defaultState();
      DECK.forEach((d) => { if (!base.nodes[d.id]) base.nodes[d.id] = freshNode(); });
      if (base.lastBuildDate !== todayStr()) { base.lastBuildDate = todayStr(); base.buildsToday = 0; }
      setSt(base);
    });
    return () => { alive = false; };
  }, []);

  const mutate = (fn) => {
    setSt((prev) => {
      const n = JSON.parse(JSON.stringify(prev));
      fn(n);
      saveState(n).then((ok) => { if (!ok) setSaveWarn(true); });
      return n;
    });
  };

  const dueQueue = useMemo(() => {
    if (!st) return [];
    return DECK.filter((d) => {
      const n = st.nodes[d.id];
      return (n.st === "b" || n.st === "s") && n.due && n.due <= today;
    }).sort((a, b) => (st.nodes[a.id].due < st.nodes[b.id].due ? -1 : 1));
  }, [st, today]);

  const unbuilt = useMemo(() => (st ? DECK.filter((d) => st.nodes[d.id].st === "u") : []), [st]);
  const surveyList = useMemo(() => unbuilt.filter((d) => !surveySkip.includes(d.id)), [unbuilt, surveySkip]);
  const sealedCount = st ? DECK.filter((d) => st.nodes[d.id].st === "s").length : 0;
  const builtCount = st ? DECK.filter((d) => st.nodes[d.id].st === "b").length : 0;

  const buildTarget = useMemo(() => {
    if (!st) return null;
    if (buildOverride && st.nodes[buildOverride] && st.nodes[buildOverride].st === "u") return DECK_BY_ID[buildOverride];
    return unbuilt[0] || null;
  }, [st, unbuilt, buildOverride]);

  if (!st) {
    return (
      <div className="wrap">
        <style>{CSS}</style>
        <div className="loading">đang mở sổ…</div>
      </div>
    );
  }

  const bumpStreak = (n) => {
    if (n.streak.last === today) return;
    n.streak.n = n.streak.last === addDays(today, -1) ? n.streak.n + 1 : 1;
    n.streak.last = today;
  };

  const gradeGate = (id, g, code, secs) => {
    mutate((n) => {
      const nd = n.nodes[id];
      nd.at += 1;
      if (g === "dung") {
        nd.iv = Math.min(nd.iv + 1, INTERVALS.length - 1);
        nd.due = addDays(today, INTERVALS[nd.iv]);
        nd.st = "s";
        nd.cr = false;
        nd.lastMissCode = null;
      } else if (g === "lech") {
        nd.due = addDays(today, 1);
        n.journal.unshift({ d: today, id, g, code: code.slice(0, 600), secs });
      } else {
        const wasSealed = nd.st === "s";
        nd.st = "u"; nd.iv = 0; nd.due = null;
        nd.cr = wasSealed || nd.cr;
        nd.miss += 1;
        nd.lastMissCode = code ? code.slice(0, 600) : nd.lastMissCode;
        n.journal.unshift({ d: today, id, g: "sai", code: (code || "").slice(0, 600), secs });
      }
      const remaining = DECK.filter((d) => {
        const x = n.nodes[d.id];
        return (x.st === "b" || x.st === "s") && x.due && x.due <= today;
      }).length;
      if (remaining === 0) bumpStreak(n);
    });
    if (g === "dung") { setStamp(true); setTimeout(() => setStamp(false), 1050); }
  };

  const gradeBuild = (id, g, code, secs) => {
    mutate((n) => {
      const nd = n.nodes[id];
      nd.at += 1;
      nd.st = "b"; nd.iv = 0; nd.due = addDays(today, 1);
      if (g === "sai") {
        nd.miss += 1;
        nd.lastMissCode = code ? code.slice(0, 600) : nd.lastMissCode;
        n.journal.unshift({ d: today, id, g: "sai", code: (code || "").slice(0, 600), secs });
      } else {
        nd.lastMissCode = null;
      }
      if (n.lastBuildDate !== today) { n.lastBuildDate = today; n.buildsToday = 0; }
      n.buildsToday += 1;
    });
    if (buildOverride === id) setBuildOverride(null);
  };

  const gradeSurvey = (id, g, code, secs) => {
    if (g === "dung") {
      mutate((n) => {
        const nd = n.nodes[id];
        nd.at += 1; nd.st = "b"; nd.iv = 1; nd.due = addDays(today, 2); nd.lastMissCode = null;
      });
    } else {
      mutate((n) => { n.nodes[id].at += 1; });
      setSurveySkip((s) => [...s, id]);
    }
    if (surveyList.length <= 1) {
      setSurvey(false);
      mutate((n) => { n.surveyDone = true; });
    }
  };

  const wipe = () => {
    clearState().then(() => {
      setSt(defaultState());
      setWipeArm(false);
      setSurveySkip([]);
      saveState(defaultState());
    });
  };

  /* ---------- render ---------- */
  const gateItem = dueQueue[0] || null;
  const showSurveyOffer = !survey && !st.surveyDone && dueQueue.length === 0 && unbuilt.length > 0 && !buildOverride;

  return (
    <div className="wrap">
      <style>{CSS}</style>

      {stamp && (
        <div className="stampwrap"><div className="stampin"><Seal size={132} /></div></div>
      )}

      <header className="head">
        <div className="brand">
          <Seal size={34} ghost />
          <div>
            <div className="brandTitle">Nền Móng</div>
            <div className="brandSub">luyện khối nhỏ · DSA · Python</div>
          </div>
        </div>
        <div className="headRight">
          <div className="date">{today}</div>
          {st.streak.n > 0 && <div className="streak">chuỗi {st.streak.n} ngày</div>}
        </div>
      </header>

      {saveWarn && <div className="warn">Lưu ý: không lưu được dữ liệu — tiến độ chỉ tồn tại trong phiên này.</div>}

      <nav className="tabs">
        {[["home", "Hôm nay"], ["map", "Bản đồ"], ["log", "Nhật ký"]].map(([k, label]) => (
          <button key={k} className={"tab " + (tab === k ? "tabOn" : "")} onClick={() => { setTab(k); setSelId(null); }}>
            {label}
            {k === "home" && dueQueue.length > 0 && <span className="dot" />}
          </button>
        ))}
      </nav>

      {tab === "home" && (
        <main>
          <div className="stats">
            <div className={"stat " + (dueQueue.length > 0 ? "statSon" : "")}>
              <div className="statN">{dueQueue.length}</div><div className="statL">đến hạn</div>
            </div>
            <div className="stat"><div className="statN">{builtCount}</div><div className="statL">đã xây</div></div>
            <div className="stat"><div className="statN">{sealedCount}</div><div className="statL">nghiệm thu</div></div>
          </div>

          {gateItem && !survey && (
            <div>
              <p className="lockline">Cổng đóng với khối mới: nghiệm thu trước, xây sau.</p>
              <Card
                key={"g-" + gateItem.id + "-" + st.nodes[gateItem.id].at}
                item={gateItem}
                node={st.nodes[gateItem.id]}
                mode="gate"
                gateNo={st.nodes[gateItem.id].iv + 1}
                onGrade={(g, c, s) => gradeGate(gateItem.id, g, c, s)}
              />
            </div>
          )}

          {!gateItem && survey && surveyList[0] && (
            <div>
              <p className="lockline">
                Khảo sát: thử lạnh từng khối. Đúng thì khỏi xây — hẹn nghiệm thu sau 2 ngày.
                Còn {surveyList.length} khối.{" "}
                <button className="btn linky" onClick={() => { setSurvey(false); mutate((n) => { n.surveyDone = true; }); }}>Dừng khảo sát</button>
              </p>
              <Card
                key={"s-" + surveyList[0].id}
                item={surveyList[0]}
                node={st.nodes[surveyList[0].id]}
                mode="survey"
                onGrade={(g, c, s) => gradeSurvey(surveyList[0].id, g, c, s)}
              />
            </div>
          )}

          {!gateItem && !survey && showSurveyOffer && (
            <div className="sheet intro">
              <h2 className="dtitle">Khảo sát nhanh</h2>
              <p className="dprompt">
                Trước khi xây, thử lạnh từng khối. Khối nào bạn viết trọn từ trí nhớ thì khỏi phải xây —
                nó vào thẳng lịch nghiệm thu. Khối nào chưa thì để lại xây sau. Với người đã có nghề,
                đây là cách trung thực nhất để biết Nền có phải nút thắt của mình hay không.
              </p>
              <div className="row">
                <button className="btn primary" onClick={() => { setSurvey(true); setSurveySkip([]); }}>Bắt đầu khảo sát</button>
                <button className="btn" onClick={() => mutate((n) => { n.surveyDone = true; })}>Bỏ qua — xây từ đầu</button>
              </div>
            </div>
          )}

          {!gateItem && !survey && !showSurveyOffer && buildTarget && (
            <div>
              {st.buildsToday >= DAILY_BATCH && !overBatch ? (
                <div className="sheet intro">
                  <p className="dprompt">
                    Đủ khẩu phần {DAILY_BATCH} khối hôm nay. Bê tông cứng qua đêm, không cứng trong một buổi.
                  </p>
                  <div className="row">
                    <button className="btn" onClick={() => setOverBatch(true)}>Vẫn xây thêm</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="lockline">
                    Xây {st.buildsToday + 1}/{DAILY_BATCH} hôm nay · còn {unbuilt.length} khối chưa xây
                    {unbuilt.length > 3 && !st.surveyDone ? "" : ""}
                  </p>
                  <Card
                    key={"b-" + buildTarget.id + "-" + st.nodes[buildTarget.id].at}
                    item={buildTarget}
                    node={st.nodes[buildTarget.id]}
                    mode="build"
                    onGrade={(g, c, s) => gradeBuild(buildTarget.id, g, c, s)}
                  />
                </div>
              )}
            </div>
          )}

          {!gateItem && !survey && !buildTarget && (
            <div className="sheet intro done">
              <Seal size={64} />
              <h2 className="dtitle" style={{ marginTop: 14 }}>Hết việc hôm nay</h2>
              <p className="dprompt">
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
            <p className="lockline">
              Còn {unbuilt.length} khối chưa xây.{" "}
              <button className="btn linky" onClick={() => { setSurveySkip([]); setSurvey(true); setTab("home"); }}>
                Khảo sát các khối còn lại
              </button>
            </p>
          )}
          {LEVELS.map((name, lv) => (
            <div className="mapRow" key={lv}>
              <div className="mapLabel">{name}</div>
              <div className="mapSquares">
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

          <div className="legend">
            <span><i className="sq sqU demo" /> chưa xây</span>
            <span><i className="sq sqB demo" /> đã xây</span>
            <span><i className="sq sqS demo" /> nghiệm thu</span>
            <span><i className="sq sqCr demo" /> nứt (rớt cổng)</span>
          </div>

          {selId && (() => {
            const d = DECK_BY_ID[selId];
            const nd = st.nodes[selId];
            const stText = nd.st === "u" ? (nd.cr ? "Chưa xây (từng nứt)" : "Chưa xây")
              : nd.st === "b" ? "Đã xây — chờ nghiệm thu" : "Đã nghiệm thu";
            return (
              <div className="sheet detail">
                <div className="sheetHead">
                  <span className="tag">{stText}</span>
                  <span className="lvl">{LEVELS[d.lv]}</span>
                </div>
                <h2 className="dtitle">{d.t}</h2>
                <p className="metaLine">
                  {nd.due ? "Cổng kế: " + nd.due + " · " : ""}lượt: {nd.at} · trượt: {nd.miss}
                </p>
                {nd.st === "u" && dueQueue.length === 0 && (
                  <div className="row">
                    <button className="btn primary" onClick={() => { setBuildOverride(d.id); setTab("home"); }}>
                      Xây khối này
                    </button>
                  </div>
                )}
                {nd.st === "u" && dueQueue.length > 0 && (
                  <p className="note">Còn {dueQueue.length} cổng đến hạn — nghiệm thu xong mới xây được.</p>
                )}
              </div>
            );
          })()}
        </main>
      )}

      {tab === "log" && (
        <main>
          {st.journal.length === 0 && (
            <div className="sheet intro"><p className="dprompt">Chưa có vết trượt nào. Nhật ký chỉ ghi khi bạn tự chấm Lệch hoặc Sai — vết trượt của chính mình đáng giá hơn mọi bộ đề dựng sẵn.</p></div>
          )}
          {st.journal.map((e, i) => {
            const d = DECK_BY_ID[e.id];
            if (!d) return null;
            return (
              <div className="sheet logEntry" key={i}>
                <div className="sheetHead">
                  <span className={"tag " + (e.g === "sai" ? "tagSon" : "")}>{e.g === "sai" ? "Sai" : "Lệch"}</span>
                  <span className="lvl">{d.t}</span>
                  <span className="timer">{e.d}</span>
                </div>
                {e.code && e.code.trim() ? <CodeBlock code={e.code} tone="old" /> : <p className="note">(bỏ trống)</p>}
                <details className="ansdetails">
                  <summary>Đáp án</summary>
                  <CodeBlock code={d.a} tone="answer" />
                </details>
              </div>
            );
          })}

          <div className="wipeRow">
            {!wipeArm ? (
              <button className="btn linky" onClick={() => setWipeArm(true)}>Xoá toàn bộ dữ liệu</button>
            ) : (
              <span>
                <span className="note">Chắc chắn? Toàn bộ tiến độ sẽ mất. </span>
                <button className="btn son" onClick={wipe}>Xoá</button>{" "}
                <button className="btn" onClick={() => setWipeArm(false)}>Thôi</button>
              </span>
            )}
          </div>
        </main>
      )}

      <footer className="foot">Bạn xây. Công cụ chỉ nghiệm thu. — v0</footer>
    </div>
  );
}

/* ---------- styles ---------- */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Be+Vietnam+Pro:wght@400;500;600&display=swap');

:root{
  --paper:#F2EADA; --paper-hi:#F8F2E3; --paper-lo:#EAE0C9;
  --ink:#2A241C; --ink-soft:#6F6453; --line:#D6C9AC; --son:#B13125;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
.wrap{
  min-height:100vh; background:var(--paper); color:var(--ink);
  font-family:'Be Vietnam Pro', system-ui, sans-serif; font-size:15px; line-height:1.55;
  max-width:680px; margin:0 auto; padding:20px 16px 48px;
}
.loading{padding:60px 0; text-align:center; color:var(--ink-soft); font-style:italic}

.head{display:flex; justify-content:space-between; align-items:center; gap:12px; padding-bottom:14px; border-bottom:1px solid var(--ink);}
.brand{display:flex; align-items:center; gap:12px}
.brandTitle{font-family:Lora, Georgia, serif; font-weight:700; font-size:24px; letter-spacing:.01em; line-height:1.1}
.brandSub{font-size:12px; color:var(--ink-soft); letter-spacing:.14em; text-transform:uppercase; margin-top:2px}
.headRight{text-align:right}
.date{font-size:13px; color:var(--ink-soft)}
.streak{font-family:Lora, Georgia, serif; font-size:14px; margin-top:2px}

.warn{margin-top:10px; padding:8px 12px; border:1px solid var(--son); color:var(--son); font-size:13px; background:var(--paper-hi)}

.tabs{display:flex; gap:2px; margin:16px 0 18px; border:1px solid var(--line); background:var(--paper-lo); padding:3px; border-radius:3px}
.tab{flex:1; position:relative; padding:8px 4px; background:transparent; border:none; cursor:pointer;
  font-family:'Be Vietnam Pro', system-ui, sans-serif; font-size:13px; letter-spacing:.06em; color:var(--ink-soft); border-radius:2px}
.tabOn{background:var(--paper-hi); color:var(--ink); font-weight:600; box-shadow:inset 0 0 0 1px var(--line)}
.dot{position:absolute; top:7px; right:10px; width:7px; height:7px; border-radius:50%; background:var(--son)}

.stats{display:flex; gap:10px; margin-bottom:16px}
.stat{flex:1; border:1px solid var(--line); background:var(--paper-hi); padding:10px 12px; border-radius:2px}
.statN{font-family:Lora, Georgia, serif; font-size:26px; font-weight:600; line-height:1}
.statL{font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-soft); margin-top:4px}
.statSon .statN{color:var(--son)}

.lockline{font-size:13px; color:var(--ink-soft); margin:0 0 10px; font-style:italic}
.lockline .btn.linky{font-style:normal}

.sheet{border:1px solid var(--ink); background:var(--paper-hi); padding:18px 18px 20px; border-radius:2px; margin-bottom:18px;
  box-shadow:3px 3px 0 rgba(42,36,28,.08)}
.sheet.intro{border-color:var(--line)}
.sheet.done{text-align:center; padding-top:28px}
.sheet.detail{margin-top:16px}
.sheetHead{display:flex; align-items:center; gap:10px; margin-bottom:10px}
.tag{font-size:11px; letter-spacing:.12em; text-transform:uppercase; border:1px solid var(--ink); padding:3px 8px; border-radius:2px}
.tagSon{border-color:var(--son); color:var(--son)}
.lvl{font-size:12px; color:var(--ink-soft)}
.timer{margin-left:auto; font-size:12px; color:var(--ink-soft); font-variant-numeric:tabular-nums}

.dtitle{font-family:Lora, Georgia, serif; font-size:21px; font-weight:600; margin:0 0 8px; line-height:1.25}
.dprompt{margin:0 0 12px; white-space:pre-wrap}
.metaLine{font-size:13px; color:var(--ink-soft); margin:0 0 12px}

.code{font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:13.5px; line-height:1.5;
  white-space:pre-wrap; word-break:break-word; padding:12px 14px; border-radius:2px; margin:0 0 12px}
.code.promptcode{background:var(--paper); border:1px dashed var(--line)}
.code.answer{background:var(--paper); border:1px solid var(--ink)}
.code.old{background:var(--paper-lo); border:1px solid var(--line); color:var(--ink-soft)}

.editor{width:100%; font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:14px; line-height:1.55;
  background:#FFFDF6; color:var(--ink); border:1px solid var(--ink); border-radius:2px; padding:12px 14px; resize:vertical; margin-bottom:12px}
.editor:focus{outline:2px solid var(--ink); outline-offset:1px}
.editor:disabled{background:var(--paper); color:var(--ink-soft)}
.editor::placeholder{color:var(--ink-soft); font-style:italic}

.row{display:flex; gap:10px; flex-wrap:wrap; align-items:center}
.btn{font-family:'Be Vietnam Pro', system-ui, sans-serif; font-size:14px; font-weight:500; cursor:pointer;
  border:1px solid var(--ink); background:var(--paper-hi); color:var(--ink); padding:9px 16px; border-radius:2px}
.btn:hover{background:var(--paper-lo)}
.btn.primary{background:var(--ink); color:var(--paper-hi)}
.btn.primary:hover{background:#3a332a}
.btn.son{background:var(--son); border-color:var(--son); color:var(--paper-hi)}
.btn.sonline{border-color:var(--son); color:var(--son); background:transparent}
.btn.sonline:hover{background:rgba(177,49,37,.07)}
.btn.linky{border:none; background:none; padding:2px 4px; text-decoration:underline; color:var(--ink-soft); font-size:13px}
.btn:focus-visible{outline:2px solid var(--son); outline-offset:2px}

.reveal{border-top:1px dashed var(--line); padding-top:14px; margin-top:2px}
.anslabel{font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-soft); margin-bottom:6px}
.note{font-size:13px; color:var(--ink-soft); margin:0 0 12px}
.gradehint{font-size:12.5px; color:var(--ink-soft); font-style:italic; margin:0 0 10px}
.prevmiss{margin-top:4px}

.mapRow{display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid var(--line)}
.mapLabel{width:150px; flex-shrink:0; font-size:13px; color:var(--ink-soft); padding-top:3px}
.mapSquares{display:flex; flex-wrap:wrap; gap:7px}
.sq{width:24px; height:24px; border-radius:2px; cursor:pointer; padding:0}
.sqU{background:transparent; border:1.5px dashed var(--ink-soft)}
.sqB{background:var(--ink); border:1.5px solid var(--ink)}
.sqS{background:var(--son); border:1.5px solid var(--son)}
.sqCr{background:transparent; border:1.5px dashed var(--son)}
.sqSel{outline:2px solid var(--ink); outline-offset:2px}
.sq.demo{display:inline-block; width:13px; height:13px; cursor:default; vertical-align:-2px; margin-right:5px}
.legend{display:flex; flex-wrap:wrap; gap:16px; font-size:12.5px; color:var(--ink-soft); padding:12px 0}

.logEntry .code{margin-bottom:8px}
.ansdetails summary{font-size:13px; color:var(--ink-soft); cursor:pointer; margin-bottom:8px}
.wipeRow{padding:18px 0 0; text-align:center}

.foot{margin-top:34px; padding-top:14px; border-top:1px solid var(--line); text-align:center; font-size:12px; color:var(--ink-soft); font-style:italic}

.stampwrap{position:fixed; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; z-index:50}
.stampin{animation:stamp .5s cubic-bezier(.2,.9,.3,1.2) both; filter:drop-shadow(0 4px 14px rgba(42,36,28,.35))}
@keyframes stamp{
  0%{transform:scale(2.1) rotate(9deg); opacity:0}
  55%{transform:scale(.94) rotate(-4deg); opacity:1}
  78%{transform:scale(1.05) rotate(-4deg)}
  100%{transform:scale(1) rotate(-4deg); opacity:1}
}
@media (prefers-reduced-motion: reduce){ .stampin{animation:none} }
@media (max-width:480px){
  .mapLabel{width:104px; font-size:12px}
  .brandTitle{font-size:21px}
}
`;
