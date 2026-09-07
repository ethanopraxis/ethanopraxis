// deck v2 — 2026-09-06: +delta corpus (kiểm toán) +delta đối xứng (lint). Nội dung tác giả duyệt.
import type { Drill } from "../../lib/nenmong/types";

export const LEVELS: string[] = [
  "Móng — cơ chế",
  "Nền 1 — Vòng lặp",
  "Nền 2 — Chuỗi",
  "Nền 3 — List",
  "Nền 4 — Dict · Set",
  "Nền 5 — Idiom LeetCode",
];

export const DECK: Drill[] = [
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
    n: "Bỏ [] trong lời gọi hàm là generator: sum(x * x for x in nums if x % 2 == 0) — không tạo list trung gian.",
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
    n: "Hoặc -(-a // b). Nhớ: // của Python làm tròn về âm vô cực, khác C/Java. Bài đếm lớn: lấy dư theo MOD = 10**9 + 7 sau MỖI phép cộng/nhân.",
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
  {
    id: "l5-bit", lv: 5, t: "Bit cơ bản",
    p: "Năm biểu thức: kiểm tra x lẻ; chia đôi x; 2 mũ k; tắt bit 1 thấp nhất của x; XOR hai số.",
    a: "x & 1            # 1 nếu x lẻ\nx >> 1           # chia nguyên cho 2\n1 << k           # 2**k\nx & (x - 1)      # tắt bit 1 thấp nhất\nx ^ y            # XOR — tự triệt tiêu: a ^ a == 0",
    n: "Python: & mạnh hơn == nên (x & 1) == 0 viết không ngoặc vẫn đúng — nhưng họ C thì KHÔNG, cứ đóng ngoặc cho thành phản xạ.",
  },
  {
    id: "l5-dfs", lv: 5, t: "DFS lồng trong method",
    p: "Trong một method, viết khung dfs(u) đệ quy duyệt g[u], cập nhật biến đếm cnt khai báo bên ngoài dfs.",
    a: "cnt = 0\ndef dfs(u):\n    nonlocal cnt\n    cnt += 1\n    for v in g[u]:\n        dfs(v)\ndfs(root)",
    n: "Chỉ ĐỌC hoặc .append thì không cần nonlocal; GÁN LẠI (cnt += 1, best = ...) mà quên nonlocal là UnboundLocalError kinh điển.",
  },
  {
    id: "l5-bisect", lv: 5, t: "bisect trái / phải",
    p: "Sau import: vị trí chèn trái của x trong mảng đã sắp a; và khi x đã có mặt thì bisect_left khác bisect_right thế nào?",
    a: "from bisect import bisect_left, bisect_right\ni = bisect_left(a, x)    # chỉ số phần tử ĐẦU TIÊN >= x\nj = bisect_right(a, x)   # chỉ số phần tử đầu tiên > x\n# x xuất hiện j - i lần; chèn giữ thứ tự: insort(a, x)",
  },
  {
    id: "l5-freq26", lv: 5, t: "Mảng đếm 26",
    p: "Đếm tần suất chữ thường của s bằng list 26 phần tử (không dùng Counter).",
    a: "freq = [0] * 26\nfor c in s:\n    freq[ord(c) - ord('a')] += 1",
    n: "Nhân list 1 CHIỀU với số nguyên là an toàn — bẫy [[0]*n]*m chỉ xảy ra khi lồng nhau (xem khối Móng). Nhanh hơn Counter khi bảng chữ cái cố định.",
  },
];
