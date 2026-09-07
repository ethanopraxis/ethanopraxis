import type { Drill } from "../../lib/nenmong/types";

export const LEVELS: string[] = [
  "Móng — cơ chế",
  "Nền 1 — Vòng lặp",
  "Nền 2 — Chuỗi",
  "Nền 3 — Array",
  "Nền 4 — Map · Set",
  "Nền 5 — Idiom LeetCode",
];

export const DECK: Drill[] = [
  // ===== MÓNG =====
  {
    id: "t-m-eq", lv: 0, t: "== so với ===",
    p: "Dự đoán hai kết quả, rồi phát biểu quy tắc một câu:",
    pc: "console.log('5' == 5);\nconsole.log('5' === 5);",
    a: "true\nfalse\n// == ép kiểu ngầm trước khi so sánh; === so cả kiểu lẫn giá trị.\n// Quy tắc: luôn dùng === và !==.",
  },
  {
    id: "t-m-ref", lv: 0, t: "Tham chiếu, không phải bản sao",
    p: "Dự đoán output, rồi viết hai cách sao chép nông:",
    pc: "const a = [1, 2, 3];\nconst b = a;\nb.push(4);\nconsole.log(a);",
    a: "[1, 2, 3, 4]\n// b = a chỉ chép tham chiếu — const không ngăn sửa NỘI DUNG.\n// Bản sao nông: [...a]  hoặc  a.slice()",
  },
  {
    id: "t-m-fill", lv: 0, t: "Bẫy fill mảng 2D",
    p: "Dự đoán output, rồi viết cách khởi tạo đúng:",
    pc: "const g = Array(2).fill(Array(3).fill(0));\ng[0][0] = 9;\nconsole.log(g);",
    a: "[[9, 0, 0], [9, 0, 0]]\n// fill dùng CÙNG MỘT tham chiếu hàng cho cả hai vị trí.\n// Cách đúng: Array.from({ length: m }, () => Array(n).fill(0))",
  },
  {
    id: "t-m-sort", lv: 0, t: "Bẫy sort mặc định",
    p: "Dự đoán output, rồi viết cách sắp số đúng:",
    pc: "console.log([10, 9, 2].sort());",
    a: "[10, 2, 9]\n// sort() mặc định đổi phần tử sang CHUỖI rồi so theo từ điển.\n// Sắp số: nums.sort((a, b) => a - b)",
  },
  {
    id: "t-m-number", lv: 0, t: "number là số thực",
    p: "Tính 7 / 2 và -7 % 2 trong JS/TS. Chia nguyên viết thế nào?",
    a: "7 / 2 === 3.5        // không có chia nguyên tự động\n-7 % 2 === -1        // % lấy dấu của số bị chia\n// Chia nguyên: Math.floor(a / b). Viết (a / b) | 0 cắt về 0 nhưng chỉ đúng trong 32-bit.",
  },
  {
    id: "t-m-bigo", lv: 0, t: "Đếm phép toán → Big-O",
    p: "Thân vòng lặp trong chạy tổng cộng bao nhiêu lần? Suy ra Big-O:",
    pc: "for (let i = 0; i < n; i++)\n    for (let j = i + 1; j < n; j++)\n        ...",
    a: "(n-1) + (n-2) + ... + 1 = n(n-1)/2  →  O(n²)",
    n: "Big-O là kết quả của việc ĐẾM, không phải bảng để thuộc lòng.",
  },
  {
    id: "t-m-recur", lv: 0, t: "Đệ quy = ngăn xếp",
    p: "f(3) in ra gì? Giải thích thứ tự bằng một câu:",
    pc: "function f(n: number): void {\n    if (n === 0) return;\n    f(n - 1);\n    console.log(n);\n}",
    a: "In: 1, 2, 3 (mỗi số một dòng)\n// console.log nằm SAU lời gọi đệ quy nên chạy lúc ngăn xếp bung ra —\n// lời gọi sâu nhất in trước.",
  },

  // ===== Nền 1 — Vòng lặp =====
  {
    id: "t-l1-forof", lv: 1, t: "for...of",
    p: "Viết dòng for duyệt từng giá trị x của nums.",
    a: "for (const x of nums)",
    n: "for...in duyệt KEY (chuỗi chỉ số) — với mảng gần như luôn là sai lầm.",
  },
  {
    id: "t-l1-entries", lv: 1, t: "entries — enumerate của JS",
    p: "Viết dòng for duyệt nums lấy cả chỉ số i và giá trị x.",
    a: "for (const [i, x] of nums.entries())",
  },
  {
    id: "t-l1-rev", lv: 1, t: "Duyệt ngược",
    p: "Viết dòng for duyệt chỉ số của nums từ cuối về đầu.",
    a: "for (let i = nums.length - 1; i >= 0; i--)",
  },
  {
    id: "t-l1-tern", lv: 1, t: "Ternary",
    p: "Một dòng: gán nhan = 'chan' nếu x chẵn, ngược lại 'le'.",
    a: "const nhan = x % 2 === 0 ? 'chan' : 'le';",
  },
  {
    id: "t-l1-bs", lv: 1, t: "Khung binary search",
    p: "Viết thân hàm binary search trên nums đã sắp xếp: trả về chỉ số của target, không có thì trả -1.",
    a: "let lo = 0, hi = nums.length - 1;\nwhile (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n}\nreturn -1;",
    n: "(lo + hi) >> 1 hay gặp nhưng chỉ đúng trong 32-bit — Math.floor an toàn hơn.",
  },

  // ===== Nền 2 — Chuỗi =====
  {
    id: "t-l2-rev", lv: 2, t: "Đảo chuỗi",
    p: "Một dòng: đảo ngược chuỗi s.",
    a: "s.split('').reverse().join('')",
    n: "split('') tách theo code unit — emoji/ký tự ghép sẽ hỏng; [...s] tách theo code point tốt hơn.",
  },
  {
    id: "t-l2-char", lv: 2, t: "Số học ký tự",
    p: "Hai biểu thức: chỉ số 0–25 của chữ thường s[i]; ký tự thứ k của bảng chữ thường.",
    a: "s.charCodeAt(i) - 97\nString.fromCharCode(97 + k)",
    n: "97 là mã của 'a' — hoặc viết tường minh 'a'.charCodeAt(0).",
  },
  {
    id: "t-l2-splitjoin", lv: 2, t: "split / join",
    p: "Hai dòng: tách câu s thành mảng từ (gộp khoảng trắng liền nhau); nối mảng parts bằng '-'.",
    a: "const words = s.trim().split(/\\s+/);\nconst kq = parts.join('-');",
    n: "s.split(' ') KHÔNG gộp khoảng trắng liền nhau — sinh phần tử rỗng.",
  },
  {
    id: "t-l2-build", lv: 2, t: "Xây chuỗi",
    p: "Ghép nhiều mảnh sinh ra trong vòng lặp thành một chuỗi — cách chuẩn mực.",
    a: "const parts: string[] = [];\nfor (const x of nums) parts.push(String(x));\nconst kq = parts.join('');",
    n: "Engine hiện đại tối ưu += khá tốt, nhưng push + join là dạng chuẩn và không phụ thuộc engine.",
  },
  {
    id: "t-l2-template", lv: 2, t: "Template literal",
    p: "Một biểu thức: ghép r và c thành chuỗi dạng \"r,c\" (dùng làm key).",
    a: "`${r},${c}`",
  },
  {
    id: "t-l2-clean", lv: 2, t: "Chuẩn hoá & kiểm tra",
    p: "Hai biểu thức: s bỏ khoảng trắng hai đầu và về chữ thường; c có phải chữ thường a–z không.",
    a: "s.trim().toLowerCase()\nc >= 'a' && c <= 'z'",
    n: "So sánh chuỗi theo mã ký tự — hoặc regex /^[a-z]$/.test(c).",
  },

  // ===== Nền 3 — Array =====
  {
    id: "t-l3-init", lv: 3, t: "Khởi tạo mảng",
    p: "Hai dòng: mảng n số 0; mảng [0, 1, ..., n-1].",
    a: "const a = new Array(n).fill(0);\nconst b = Array.from({ length: n }, (_, i) => i);",
  },
  {
    id: "t-l3-matrix", lv: 3, t: "Ma trận 2D",
    p: "Tạo ma trận m hàng × n cột toàn 0 — đúng cách.",
    a: "const g = Array.from({ length: m }, () => Array(n).fill(0));",
    n: "Khối Móng liên quan: 'Bẫy fill mảng 2D'.",
  },
  {
    id: "t-l3-mapfilter", lv: 3, t: "filter + map",
    p: "Một dòng: mảng bình phương của các số chẵn trong nums.",
    v: ["Một dòng: từ nums tạo mảng mới gồm x*x với mọi x chẵn."],
    a: "nums.filter(x => x % 2 === 0).map(x => x * x)",
  },
  {
    id: "t-l3-sortnum", lv: 3, t: "Sắp số",
    p: "Hai dòng: sắp nums tăng dần; giảm dần.",
    a: "nums.sort((a, b) => a - b);\nnums.sort((a, b) => b - a);",
    n: "Khối Móng liên quan: 'Bẫy sort mặc định'. sort sửa TẠI CHỖ — bản mới: [...nums].sort(...) hoặc toSorted.",
  },
  {
    id: "t-l3-sortmulti", lv: 3, t: "Khoá kép bằng ||",
    p: "Sắp pts (mỗi phần tử [x, y]) theo x tăng dần, x bằng nhau thì y giảm dần — một comparator.",
    a: "pts.sort((p, q) => p[0] - q[0] || q[1] - p[1]);",
    n: "Khi hiệu đầu bằng 0 (falsy), || chuyển sang khoá sau — idiom khoá kép của JS.",
  },
  {
    id: "t-l3-slice", lv: 3, t: "slice",
    p: "Ba biểu thức: 3 phần tử đầu của a; 3 phần tử cuối; bản sao nông.",
    a: "a.slice(0, 3)\na.slice(-3)\na.slice()",
    n: "slice KHÔNG sửa mảng gốc; splice thì CÓ — hai tên một chữ khác nhau.",
  },
  {
    id: "t-l3-pushpop", lv: 3, t: "Hai đầu mảng",
    p: "Bốn thao tác và độ phức tạp: thêm/bỏ ở cuối; thêm/bỏ ở đầu.",
    a: "a.push(x);   a.pop();      // O(1)\na.unshift(x); a.shift();    // O(n) — dồn toàn bộ phần tử",
    n: "Vì shift là O(n), BFS trên mảng lớn không dùng shift — xem khối hàng đợi ở Nền 5.",
  },
  {
    id: "t-l3-reduce", lv: 3, t: "reduce & max",
    p: "Hai dòng: tổng của nums; giá trị lớn nhất của nums.",
    a: "const s = nums.reduce((acc, x) => acc + x, 0);\nconst best = Math.max(...nums);",
    n: "Spread đẩy từng phần tử làm đối số — mảng cực lớn có thể vỡ stack; khi đó dùng reduce với Math.max.",
  },

  // ===== Nền 4 — Map · Set =====
  {
    id: "t-l4-map", lv: 4, t: "Map cơ bản",
    p: "Bốn thao tác: tạo Map; gán k → v; đọc k; kiểm tra k tồn tại. Số phần tử viết thế nào?",
    a: "const m = new Map<string, number>();\nm.set(k, v);\nm.get(k);\nm.has(k);\n// Số phần tử: m.size — thuộc tính, KHÔNG có ngoặc.",
  },
  {
    id: "t-l4-count", lv: 4, t: "Đếm tần suất",
    p: "Đếm tần suất ký tự của chuỗi s vào Map.",
    v: ["Xây map cnt: mỗi ký tự của s → số lần xuất hiện, dùng ??."],
    a: "const cnt = new Map<string, number>();\nfor (const c of s) cnt.set(c, (cnt.get(c) ?? 0) + 1);",
    n: "?? chỉ thay khi null/undefined — dùng || ở đây cũng chạy nhưng sai tinh thần (0 là falsy).",
  },
  {
    id: "t-l4-group", lv: 4, t: "Gom nhóm",
    p: "Gom các từ trong words theo ký tự đầu vào Map<string, string[]>.",
    a: "const d = new Map<string, string[]>();\nfor (const w of words) {\n    if (!d.has(w[0])) d.set(w[0], []);\n    d.get(w[0])!.push(w);\n}",
    n: "Dấu ! là non-null assertion của TS — hợp lệ ở đây vì dòng trên vừa đảm bảo key tồn tại.",
  },
  {
    id: "t-l4-iter", lv: 4, t: "Duyệt Map",
    p: "Hai mảnh: vòng for duyệt map m lấy cả key và value; lấy mảng toàn bộ key.",
    a: "for (const [k, v] of m)\nconst keys = [...m.keys()];",
    n: "Map giữ đúng thứ tự chèn.",
  },
  {
    id: "t-l4-set", lv: 4, t: "Set",
    p: "Bốn thao tác: loại trùng của nums; thêm x vào seen; kiểm tra x; giao của hai set a, b.",
    a: "const uniq = new Set(nums);\nseen.add(x);\nseen.has(x);\nconst giao = [...a].filter(x => b.has(x));",
  },
  {
    id: "t-l4-objvsmap", lv: 4, t: "Object hay Map?",
    p: "Nêu hai lý do chọn Map thay vì object {} khi làm key-value trong bài thuật toán.",
    a: "1) Key của object bị ép về CHUỖI — obj[1] và obj['1'] là một; Map giữ nguyên kiểu key.\n2) Map có .size, giữ thứ tự chèn, và duyệt sạch — không dính key kế thừa từ prototype.",
  },

  // ===== Nền 5 — Idiom LeetCode =====
  {
    id: "t-l5-swap", lv: 5, t: "Hoán đổi & destructuring",
    p: "Hai dòng: hoán đổi a và b; tách nums thành first và phần còn lại rest.",
    a: "[a, b] = [b, a];\nconst [first, ...rest] = nums;",
  },
  {
    id: "t-l5-inf", lv: 5, t: "Vô cực & giới hạn an toàn",
    p: "Hai dòng: best = dương vô cực, worst = âm vô cực. Số nguyên chính xác đến đâu?",
    a: "let best = Infinity;\nlet worst = -Infinity;\n// Chính xác đến Number.MAX_SAFE_INTEGER (2^53 - 1) — vượt ngưỡng phải dùng BigInt.",
  },
  {
    id: "t-l5-floor", lv: 5, t: "Chia sàn & mod dương",
    p: "Hai biểu thức: chia sàn a cho b; phần dư LUÔN không âm của a theo b.",
    a: "Math.floor(a / b)\n((a % b) + b) % b",
    n: "Khối Móng liên quan: 'number là số thực' — % của JS lấy dấu số bị chia nên cần công thức thứ hai.",
  },
  {
    id: "t-l5-queue", lv: 5, t: "Hàng đợi BFS bằng con trỏ",
    p: "JS không có deque sẵn và shift là O(n) — viết hàng đợi BFS đúng độ phức tạp.",
    a: "const q: number[] = [start];\nlet head = 0;\nwhile (head < q.length) {\n    const v = q[head++];\n    q.push(...);\n}",
    n: "Không xoá đầu mảng — chỉ dịch con trỏ head. O(1) mỗi thao tác.",
  },
  {
    id: "t-l5-heap", lv: 5, t: "Heap ở đâu?",
    p: "JS/TS không có heap trong ngôn ngữ — nêu lối đi trên LeetCode và viết 3 dòng dùng min-heap.",
    a: "// LeetCode nạp sẵn thư viện datastructures-js/priority-queue:\nconst pq = new MinPriorityQueue<number>();\npq.enqueue(x);\nconst v = pq.dequeue();",
    n: "API khác nhau giữa phiên bản thư viện (dequeue trả phần tử hay object) — kiểm tra trước khi thi; phỏng vấn thuần JS thì phải tự cài heap.",
  },
  {
    id: "t-l5-memo", lv: 5, t: "Memo bằng Map",
    p: "Viết khung nhớ hoá cho dfs(i, j): key chuỗi, kiểm tra trước, lưu khi tính xong.",
    a: "const memo = new Map<string, number>();\nfunction dfs(i: number, j: number): number {\n    const key = `${i},${j}`;\n    if (memo.has(key)) return memo.get(key)!;\n    const kq = /* tính */;\n    memo.set(key, kq);\n    return kq;\n}",
  },
  {
    id: "t-l5-dirs", lv: 5, t: "Duyệt 4 hướng lưới",
    p: "Từ ô (x, y): sinh 4 ô kề và lọc những ô nằm trong biên lưới m × n.",
    a: "const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];\nfor (const [dx, dy] of dirs) {\n    const nx = x + dx, ny = y + dy;\n    if (nx >= 0 && nx < m && ny >= 0 && ny < n) {\n        ...\n    }\n}",
  },
];
