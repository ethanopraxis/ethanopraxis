// deck v2 — 2026-09-06: +delta corpus (kiểm toán) +delta đối xứng (lint). Nội dung tác giả duyệt.
import type { Drill } from "../../lib/nenmong/types";

export const LEVELS: string[] = [
  "Móng — cơ chế",
  "Nền 1 — Vòng lặp",
  "Nền 2 — Chuỗi",
  "Nền 3 — Mảng · List",
  "Nền 4 — Map · Set",
  "Nền 5 — Idiom LeetCode",
];

export const DECK: Drill[] = [
  // ===== MÓNG =====
  {
    id: "j-m-equals", lv: 0, t: "== so với .equals",
    p: "Dự đoán hai kết quả, rồi phát biểu quy tắc một câu:",
    pc: "String a = new String(\"hello\");\nString b = \"hello\";\nSystem.out.println(a == b);\nSystem.out.println(a.equals(b));",
    a: "false\ntrue\n// == so sánh THAM CHIẾU; .equals so sánh nội dung.\n// Với String và mọi object: luôn dùng .equals.",
  },
  {
    id: "j-m-intcache", lv: 0, t: "Bẫy Integer cache",
    p: "Dự đoán hai kết quả, rồi giải thích:",
    pc: "Integer a = 127, b = 127;\nInteger c = 128, d = 128;\nSystem.out.println(a == b);\nSystem.out.println(c == d);",
    a: "true\nfalse\n// Integer cache sẵn từ -128 đến 127 — trong khoảng đó autoboxing trả cùng object.\n// Ngoài khoảng: object mới → == sai. So sánh Integer bằng .equals hoặc unbox về int.",
  },
  {
    id: "j-m-arrayref", lv: 0, t: "Mảng là object",
    p: "Dự đoán output, rồi viết cách sao chép đúng:",
    pc: "int[] a = {1, 2, 3};\nint[] b = a;\nb[0] = 9;\nSystem.out.println(a[0]);",
    a: "9\n// Mảng là object — b = a chỉ chép tham chiếu.\n// Bản sao: int[] b = a.clone();  hoặc  Arrays.copyOf(a, a.length);",
  },
  {
    id: "j-m-intdiv", lv: 0, t: "Chia nguyên cắt về 0",
    p: "Tính -7 / 2 và -7 % 2 trong Java. Muốn chia sàn (floor) thì dùng gì?",
    a: "-7 / 2 == -3\n-7 % 2 == -1\n// Java cắt về 0 (khác Python làm tròn về âm vô cực).\n// Chia sàn: Math.floorDiv(-7, 2) == -4;  Math.floorMod(-7, 2) == 1",
  },
  {
    id: "j-m-bigo", lv: 0, t: "Đếm phép toán → Big-O",
    p: "Thân vòng lặp trong chạy tổng cộng bao nhiêu lần? Suy ra Big-O:",
    pc: "for (int i = 0; i < n; i++)\n    for (int j = i + 1; j < n; j++)\n        ...",
    a: "(n-1) + (n-2) + ... + 1 = n(n-1)/2  →  O(n²)",
    n: "Big-O là kết quả của việc ĐẾM, không phải bảng để thuộc lòng.",
  },
  {
    id: "j-m-recur", lv: 0, t: "Đệ quy = ngăn xếp",
    p: "f(3) in ra gì? Giải thích thứ tự bằng một câu:",
    pc: "void f(int n) {\n    if (n == 0) return;\n    f(n - 1);\n    System.out.println(n);\n}",
    a: "In: 1, 2, 3 (mỗi số một dòng)\n// println nằm SAU lời gọi đệ quy nên chạy lúc ngăn xếp bung ra —\n// lời gọi sâu nhất in trước.",
  },

  // ===== Nền 1 — Vòng lặp =====
  {
    id: "j-l1-forindex", lv: 1, t: "for theo chỉ số",
    p: "Viết dòng for duyệt mảng nums theo chỉ số i.",
    a: "for (int i = 0; i < nums.length; i++)",
  },
  {
    id: "j-l1-foreach", lv: 1, t: "for-each",
    p: "Viết dòng for duyệt từng giá trị x của mảng nums (không cần chỉ số).",
    a: "for (int x : nums)",
    n: "Cần cả chỉ số lẫn giá trị thì Java không có enumerate — dùng for chỉ số rồi đọc nums[i].",
  },
  {
    id: "j-l1-rev", lv: 1, t: "Duyệt ngược",
    p: "Viết dòng for duyệt chỉ số của nums từ cuối về đầu.",
    a: "for (int i = nums.length - 1; i >= 0; i--)",
  },
  {
    id: "j-l1-bs", lv: 1, t: "Khung binary search",
    p: "Viết thân hàm binary search trên nums đã sắp xếp: trả về chỉ số của target, không có thì trả -1.",
    a: "int lo = 0, hi = nums.length - 1;\nwhile (lo <= hi) {\n    int mid = lo + (hi - lo) / 2;\n    if (nums[mid] == target) return mid;\n    if (nums[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n}\nreturn -1;",
    n: "mid = (lo + hi) / 2 có thể TRÀN int — lo + (hi - lo) / 2 là dạng an toàn.",
  },
  {
    id: "j-l1-tern", lv: 1, t: "Ternary",
    p: "Một dòng: gán nhan = \"chan\" nếu x chẵn, ngược lại \"le\".",
    a: "String nhan = x % 2 == 0 ? \"chan\" : \"le\";",
  },
  {
    id: "j-l1-bounds", lv: 1, t: "Kiểm tra biên",
    p: "Viết điều kiện kiểm tra 0 ≤ i < n trong Java.",
    a: "if (i >= 0 && i < n)",
    n: "Java không có so sánh chuỗi hoá kiểu 0 <= i < n của Python — phải nối bằng &&.",
  },

  // ===== Nền 2 — Chuỗi =====
  {
    id: "j-l2-charat", lv: 2, t: "charAt & length",
    p: "Hai biểu thức: ký tự thứ i của chuỗi s; độ dài của s.",
    a: "s.charAt(i)\ns.length()",
    n: "Bẫy nhỏ mà vấp hoài: chuỗi là length() có ngoặc, mảng là length không ngoặc.",
  },
  {
    id: "j-l2-chars", lv: 2, t: "Duyệt ký tự",
    p: "Viết dòng for duyệt từng ký tự c của chuỗi s.",
    a: "for (char c : s.toCharArray())",
  },
  {
    id: "j-l2-sb", lv: 2, t: "StringBuilder",
    p: "Ghép nhiều mảnh chuỗi trong vòng lặp — viết cách đúng về hiệu năng (khởi tạo, nối từng x, lấy kết quả).",
    a: "StringBuilder sb = new StringBuilder();\nfor (int x : nums) sb.append(x);\nString kq = sb.toString();",
    n: "Cộng String bằng + trong vòng lặp là O(n²) vì String bất biến.",
  },
  {
    id: "j-l2-reverse", lv: 2, t: "Đảo chuỗi",
    p: "Một dòng: đảo ngược chuỗi s.",
    a: "String r = new StringBuilder(s).reverse().toString();",
  },
  {
    id: "j-l2-splitjoin", lv: 2, t: "split / join",
    p: "Hai dòng: tách câu s thành mảng từ theo khoảng trắng; nối mảng parts thành chuỗi cách nhau bởi '-'.",
    a: "String[] words = s.split(\" \");\nString kq = String.join(\"-\", parts);",
    n: "split nhận REGEX — tách theo dấu chấm phải viết s.split(\"\\\\.\"). Nhiều khoảng trắng liền nhau: s.trim().split(\"\\\\s+\").",
  },
  {
    id: "j-l2-ord", lv: 2, t: "Số học ký tự",
    p: "Hai biểu thức: chỉ số 0–25 của chữ thường c; ký tự thứ k (0-based) của bảng chữ thường.",
    a: "c - 'a'\n(char) ('a' + k)",
    n: "char cộng int ra int — phải ép (char) khi gán ngược lại.",
  },
  {
    id: "j-l2-conv", lv: 2, t: "Đổi kiểu & phân loại",
    p: "Bốn biểu thức: số 123 thành chuỗi; chuỗi \"123\" thành int; c là chữ số?; c là chữ cái?",
    a: "String.valueOf(123)\nInteger.parseInt(\"123\")\nCharacter.isDigit(c)\nCharacter.isLetter(c)",
  },

  // ===== Nền 3 — Mảng · List =====
  {
    id: "j-l3-init", lv: 3, t: "Khởi tạo mảng",
    p: "Hai dòng: mảng int n phần tử (mặc định 0); lấp toàn bộ mảng a bằng -1.",
    a: "int[] a = new int[n];\nArrays.fill(a, -1);",
    n: "Cùng khuôn cho mảng thăm: boolean[] visited = new boolean[n]; (mặc định false).",
  },
  {
    id: "j-l3-matrix", lv: 3, t: "Ma trận 2D",
    p: "Một dòng: tạo ma trận int m hàng × n cột toàn 0.",
    a: "int[][] g = new int[m][n];",
    n: "Java KHÔNG có bẫy alias kiểu [[0]*n]*m của Python — mỗi hàng là mảng riêng.",
  },
  {
    id: "j-l3-sort", lv: 3, t: "Sắp xếp mảng",
    p: "Sắp xếp mảng int[] a tăng dần. Muốn giảm dần thì sao?",
    a: "Arrays.sort(a);\n// Giảm dần: int[] không nhận Comparator —\n// hoặc sort tăng rồi đọc ngược, hoặc box sang Integer[]:\n// Arrays.sort(boxed, Comparator.reverseOrder());",
  },
  {
    id: "j-l3-sortcmp", lv: 3, t: "Sort với Comparator",
    p: "Sắp xếp mảng 2D pts (mỗi phần tử là int[]{x, y}) theo x tăng dần.",
    a: "Arrays.sort(pts, (p, q) -> Integer.compare(p[0], q[0]));",
    n: "Đừng viết p[0] - q[0] khi giá trị có thể lớn — hiệu có thể tràn int. Integer.compare an toàn.",
  },
  {
    id: "j-l3-list", lv: 3, t: "ArrayList cơ bản",
    p: "Bốn thao tác: tạo List<Integer> rỗng; thêm x vào cuối; đọc phần tử cuối; xoá phần tử cuối.",
    a: "List<Integer> list = new ArrayList<>();\nlist.add(x);\nlist.get(list.size() - 1);\nlist.remove(list.size() - 1);",
    n: "Bẫy List<Integer>: remove(int) xoá theo CHỈ SỐ, remove(Object) xoá theo giá trị — list.remove(5) và list.remove(Integer.valueOf(5)) là hai việc khác nhau.",
  },
  {
    id: "j-l3-copy", lv: 3, t: "Cắt mảng",
    p: "Một dòng: lấy đoạn con của mảng a từ chỉ số l đến r-1.",
    a: "int[] sub = Arrays.copyOfRange(a, l, r);",
    n: "Nửa mở [l, r) — giống slice của Python.",
  },
  {
    id: "j-l3-prefix", lv: 3, t: "Prefix sum",
    p: "Xây mảng cộng dồn p của nums sao cho p[i] = tổng i phần tử đầu (p[0] = 0).",
    a: "int[] p = new int[nums.length + 1];\nfor (int i = 0; i < nums.length; i++)\n    p[i + 1] = p[i] + nums[i];",
    n: "Tổng đoạn nums[l..r] = p[r+1] - p[l]. Tổng lớn: dùng long[].",
  },
  {
    id: "j-l3-max", lv: 3, t: "Max và chỉ số của max",
    p: "Duyệt mảng nums, giữ lại giá trị lớn nhất best và chỉ số của nó bestIdx.",
    a: "int best = nums[0], bestIdx = 0;\nfor (int i = 1; i < nums.length; i++)\n    if (nums[i] > best) { best = nums[i]; bestIdx = i; }",
  },

  // ===== Nền 4 — Map · Set =====
  {
    id: "j-l4-count", lv: 4, t: "Đếm tần suất",
    p: "Đếm tần suất ký tự của chuỗi s vào Map<Character, Integer>.",
    v: ["Xây map cnt: mỗi ký tự của s → số lần xuất hiện, dùng getOrDefault."],
    a: "Map<Character, Integer> cnt = new HashMap<>();\nfor (char c : s.toCharArray())\n    cnt.put(c, cnt.getOrDefault(c, 0) + 1);",
    n: "Gọn hơn nữa: cnt.merge(c, 1, Integer::sum);",
  },
  {
    id: "j-l4-computeif", lv: 4, t: "computeIfAbsent",
    p: "Gom các từ trong words theo chữ cái đầu vào Map<Character, List<String>> — một dòng trong vòng lặp, không if.",
    a: "for (String w : words)\n    map.computeIfAbsent(w.charAt(0), k -> new ArrayList<>()).add(w);",
    n: "Đây là defaultdict(list) của Java.",
  },
  {
    id: "j-l4-getor", lv: 4, t: "getOrDefault",
    p: "Một dòng: đọc giá trị của key k trong map m, không có thì lấy 0.",
    a: "int v = m.getOrDefault(k, 0);",
  },
  {
    id: "j-l4-iter", lv: 4, t: "Duyệt map",
    p: "Hai mảnh: vòng for duyệt map m lấy cả key và value; điều kiện kiểm tra key k có trong m.",
    a: "for (Map.Entry<Character, Integer> e : m.entrySet()) {\n    e.getKey(); e.getValue();\n}\nif (m.containsKey(k))",
  },
  {
    id: "j-l4-set", lv: 4, t: "HashSet",
    p: "Ba thao tác: tạo Set<Integer> rỗng tên seen; thêm x; kiểm tra x đã có chưa.",
    a: "Set<Integer> seen = new HashSet<>();\nseen.add(x);\nseen.contains(x)",
    n: "add trả về false nếu phần tử đã có — dùng luôn làm phép kiểm tra kiêm chèn.",
  },
  {
    id: "j-l4-key", lv: 4, t: "Key tổng hợp",
    p: "Cần dùng toạ độ (r, c) làm key của HashMap — viết cách đúng và nói vì sao KHÔNG dùng int[].",
    a: "map.put(r + \",\" + c, val);   // hoặc: map.put(List.of(r, c), val);\n// int[] KHÔNG dùng được làm key: mảng equals/hashCode theo THAM CHIẾU,\n// hai mảng cùng nội dung vẫn là hai key khác nhau.",
  },
  {
    id: "j-l4-freqmax", lv: 4, t: "Key có value lớn nhất",
    p: "Một dòng: lấy key có value lớn nhất trong Map<Integer, Integer> m.",
    a: "int best = Collections.max(m.entrySet(), Map.Entry.comparingByValue()).getKey();",
  },

  // ===== Nền 5 — Idiom LeetCode =====
  {
    id: "j-l5-swap", lv: 5, t: "Hoán đổi",
    p: "Hoán đổi hai biến a và b.",
    a: "int t = a; a = b; b = t;",
    n: "Java không có tuple swap a, b = b, a — biến tạm là chuẩn mực.",
  },
  {
    id: "j-l5-minmax", lv: 5, t: "Vô cực nguyên",
    p: "Khởi tạo best = giá trị int lớn nhất và worst = nhỏ nhất.",
    a: "int best = Integer.MAX_VALUE;\nint worst = Integer.MIN_VALUE;",
    n: "MAX_VALUE + 1 lặng lẽ tràn thành MIN_VALUE — cộng dồn lớn thì chuyển sang long.",
  },
  {
    id: "j-l5-deque", lv: 5, t: "ArrayDeque cho BFS",
    p: "Ba dòng: tạo hàng đợi chứa sẵn start; thêm x vào cuối; lấy phần tử đầu ra biến v.",
    a: "Deque<Integer> q = new ArrayDeque<>();\nq.offer(start);\nint v = q.poll();",
    n: "ArrayDeque nhanh hơn LinkedList và thay luôn Stack cũ (push/pop cùng class).",
  },
  {
    id: "j-l5-pq", lv: 5, t: "PriorityQueue",
    p: "Hai dòng: tạo min-heap Integer; tạo max-heap Integer.",
    a: "PriorityQueue<Integer> minH = new PriorityQueue<>();\nPriorityQueue<Integer> maxH = new PriorityQueue<>(Comparator.reverseOrder());",
  },
  {
    id: "j-l5-pqpair", lv: 5, t: "Heap chứa cặp",
    p: "Tạo min-heap các cặp (dist, node) sắp theo dist; đẩy một cặp vào.",
    a: "PriorityQueue<int[]> pq = new PriorityQueue<>((p, q) -> Integer.compare(p[0], q[0]));\npq.offer(new int[]{dist, node});",
    n: "Java không có tuple — int[] hai phần tử là quy ước LeetCode.",
  },
  {
    id: "j-l5-freq26", lv: 5, t: "Mảng đếm 26",
    p: "Đếm tần suất chữ thường của s bằng mảng int (không dùng Map).",
    a: "int[] freq = new int[26];\nfor (char c : s.toCharArray()) freq[c - 'a']++;",
    n: "Nhanh và gọn hơn HashMap khi bảng chữ cái cố định — idiom số một của bài chuỗi.",
  },
  {
    id: "j-l5-memo", lv: 5, t: "Memo bằng mảng",
    p: "Viết khung nhớ hoá cho hàm đệ quy f(k): mảng memo khởi tạo -1, kiểm tra trước, lưu khi tính xong.",
    a: "int[] memo = new int[n + 1];\nArrays.fill(memo, -1);\n\nint f(int k) {\n    if (memo[k] != -1) return memo[k];\n    int kq = /* tính */;\n    return memo[k] = kq;\n}",
  },
  {
    id: "j-l5-dirs", lv: 5, t: "Duyệt 4 hướng lưới",
    p: "Từ ô (x, y): sinh 4 ô kề và lọc những ô nằm trong biên lưới m × n.",
    a: "int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};\nfor (int[] d : dirs) {\n    int nx = x + d[0], ny = y + d[1];\n    if (nx >= 0 && nx < m && ny >= 0 && ny < n) {\n        ...\n    }\n}",
  },
  {
    id: "j-l2-substr", lv: 2, t: "substring",
    p: "Hai biểu thức: chuỗi con của s từ chỉ số l đến r-1; từ l đến hết chuỗi.",
    a: "s.substring(l, r)   // nửa mở [l, r) — r KHÔNG bao gồm\ns.substring(l)",
    n: "Đổi qua C++ là dính: substr(pos, LEN) nhận ĐỘ DÀI, không phải chỉ số cuối.",
  },
  {
    id: "j-l2-pal", lv: 2, t: "Palindrome",
    p: "Một biểu thức boolean: s có phải palindrome không?",
    a: "new StringBuilder(s).reverse().toString().equals(s)",
    n: "Nhớ .equals — so sánh chuỗi bằng == là bẫy Móng.",
  },
  {
    id: "j-l5-bit", lv: 5, t: "Bit cơ bản",
    p: "Năm biểu thức: kiểm tra x lẻ; chia đôi x; 2 mũ k; tắt bit 1 thấp nhất; XOR.",
    a: "(x & 1) == 1\nx >> 1\n1 << k\nx & (x - 1)\nx ^ y",
    n: "x & 1 == 0 KHÔNG compile — == mạnh hơn & trong Java, thành int & boolean. Luôn đóng ngoặc. Số âm: >> giữ dấu, >>> đổ số 0.",
  },
  {
    id: "j-l5-dfs", lv: 5, t: "DFS kiểu Java: field + helper",
    p: "Java không có hàm lồng — viết khung DFS chuẩn LeetCode: trạng thái chia sẻ + method helper đệ quy.",
    a: "private List<List<Integer>> g;\nprivate int cnt;\n\nprivate void dfs(int u) {\n    cnt++;\n    for (int v : g.get(u)) dfs(v);\n}",
    n: "Trạng thái chung đi qua FIELD của class (hoặc tham số), không qua closure — vì vậy code Java LC hay có biến instance ở đầu class.",
  },
];
