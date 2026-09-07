// deck v2 — 2026-09-06: +delta corpus (kiểm toán) +delta đối xứng (lint). Nội dung tác giả duyệt.
import type { Drill } from "../../lib/nenmong/types";

export const LEVELS: string[] = [
  "Móng — cơ chế",
  "Nền 1 — Vòng lặp",
  "Nền 2 — Chuỗi",
  "Nền 3 — Slice",
  "Nền 4 — Map",
  "Nền 5 — Idiom LeetCode",
];

export const DECK: Drill[] = [
  // ===== MÓNG =====
  {
    id: "g-m-slicehdr", lv: 0, t: "Slice chia sẻ mảng nền",
    p: "Dự đoán output, rồi viết cách sao chép đúng:",
    pc: "s := []int{1, 2, 3}\nt := s\nt[0] = 9\nfmt.Println(s)",
    a: "[9 2 3]\n// Slice là một header (con trỏ + len + cap) — t := s chia sẻ CÙNG mảng nền.\n// Bản sao: c := append([]int(nil), s...)  hoặc  c := make([]int, len(s)); copy(c, s)",
  },
  {
    id: "g-m-append", lv: 0, t: "Bẫy append trên slice con",
    p: "Dự đoán output, rồi giải thích:",
    pc: "a := []int{1, 2, 3}\nb := a[:1]\nb = append(b, 99)\nfmt.Println(a)",
    a: "[1 99 3]\n// b có len 1 nhưng cap 3 — append còn chỗ nên GHI ĐÈ lên mảng nền của a.\n// Muốn tách hẳn: b := append([]int(nil), a[:1]...)",
  },
  {
    id: "g-m-nilmap", lv: 0, t: "Nil map",
    p: "Đoạn này chạy hay panic? Vì sao? Sửa thế nào?",
    pc: "var m map[string]int\nm[\"a\"] = 1",
    a: "panic: assignment to entry in nil map\n// ĐỌC từ nil map thì được (trả zero value), GHI thì panic.\n// Phải khởi tạo: m := make(map[string]int)  hoặc  m := map[string]int{}",
  },
  {
    id: "g-m-runes", lv: 0, t: "Byte không phải ký tự",
    p: "Với s := \"gà\": len(s) bằng bao nhiêu? Muốn đếm và duyệt theo KÝ TỰ thì làm sao?",
    a: "len(s) == 3   // len đếm BYTE: 'g' 1 byte, 'à' 2 byte UTF-8\n// Đếm ký tự: utf8.RuneCountInString(s) == 2\n// Duyệt ký tự: for _, r := range s { ... }  hoặc  []rune(s)",
    n: "s[i] trả về byte — với tiếng Việt và Unicode nói chung, index thẳng là sai.",
  },
  {
    id: "g-m-bigo", lv: 0, t: "Đếm phép toán → Big-O",
    p: "Thân vòng lặp trong chạy tổng cộng bao nhiêu lần? Suy ra Big-O:",
    pc: "for i := 0; i < n; i++ {\n    for j := i + 1; j < n; j++ {\n        ...\n    }\n}",
    a: "(n-1) + (n-2) + ... + 1 = n(n-1)/2  →  O(n²)",
    n: "Big-O là kết quả của việc ĐẾM, không phải bảng để thuộc lòng.",
  },
  {
    id: "g-m-recur", lv: 0, t: "Đệ quy = ngăn xếp",
    p: "f(3) in ra gì? Giải thích thứ tự bằng một câu:",
    pc: "func f(n int) {\n    if n == 0 {\n        return\n    }\n    f(n - 1)\n    fmt.Println(n)\n}",
    a: "In: 1, 2, 3 (mỗi số một dòng)\n// Println nằm SAU lời gọi đệ quy nên chạy lúc ngăn xếp bung ra —\n// lời gọi sâu nhất in trước.",
  },

  // ===== Nền 1 — Vòng lặp =====
  {
    id: "g-l1-range", lv: 1, t: "range",
    p: "Viết dòng for duyệt nums lấy cả chỉ số i và giá trị x. Chỉ cần giá trị thì sao?",
    a: "for i, x := range nums {\n// Chỉ cần giá trị: for _, x := range nums {",
  },
  {
    id: "g-l1-classic", lv: 1, t: "for ba phần",
    p: "Viết dòng for duyệt i từ 0 đến n-1.",
    a: "for i := 0; i < n; i++ {",
  },
  {
    id: "g-l1-while", lv: 1, t: "Go không có while",
    p: "Viết vòng lặp chạy khi lo <= hi (kiểu while).",
    a: "for lo <= hi {",
    n: "for là từ khoá lặp duy nhất của Go — for điều_kiện chính là while.",
  },
  {
    id: "g-l1-rev", lv: 1, t: "Duyệt ngược",
    p: "Viết dòng for duyệt chỉ số của nums từ cuối về đầu.",
    a: "for i := len(nums) - 1; i >= 0; i-- {",
  },
  {
    id: "g-l1-noternary", lv: 1, t: "Không có ternary",
    p: "Gán nhan = \"chan\" nếu x chẵn, ngược lại \"le\" — theo cách Go.",
    a: "nhan := \"le\"\nif x%2 == 0 {\n    nhan = \"chan\"\n}",
    n: "Go cố ý KHÔNG có toán tử ?: — gán mặc định rồi if là idiom chuẩn.",
  },
  {
    id: "g-l1-bs", lv: 1, t: "Khung binary search",
    p: "Viết thân hàm binary search trên nums đã sắp xếp: trả về chỉ số của target, không có thì trả -1.",
    a: "lo, hi := 0, len(nums)-1\nfor lo <= hi {\n    mid := lo + (hi-lo)/2\n    if nums[mid] == target {\n        return mid\n    }\n    if nums[mid] < target {\n        lo = mid + 1\n    } else {\n        hi = mid - 1\n    }\n}\nreturn -1",
    n: "Chuẩn thư viện: sort.Search(n, func(i int) bool) trả chỉ số ĐẦU TIÊN làm hàm true — xuất hiện đều trong lời giải Go thật.",
  },

  // ===== Nền 2 — Chuỗi =====
  {
    id: "g-l2-reverse", lv: 2, t: "Đảo chuỗi",
    p: "Đảo ngược chuỗi s (an toàn Unicode) — Go không có hàm sẵn.",
    a: "r := []rune(s)\nfor i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {\n    r[i], r[j] = r[j], r[i]\n}\nkq := string(r)",
    n: "Chuỗi Go bất biến — phải đổi sang []rune (hoặc []byte nếu chắc chắn ASCII).",
  },
  {
    id: "g-l2-builder", lv: 2, t: "strings.Builder",
    p: "Ghép nhiều mảnh chuỗi trong vòng lặp — viết cách đúng về hiệu năng.",
    a: "var sb strings.Builder\nfor _, w := range parts {\n    sb.WriteString(w)\n}\nkq := sb.String()",
    n: "Cộng chuỗi bằng += trong vòng lặp là O(n²).",
  },
  {
    id: "g-l2-splitjoin", lv: 2, t: "Fields / Join",
    p: "Hai dòng: tách câu s thành các từ theo khoảng trắng (gộp khoảng trắng liền nhau); nối slice parts bằng '-'.",
    a: "words := strings.Fields(s)\nkq := strings.Join(parts, \"-\")",
    n: "strings.Split(s, \" \") KHÔNG gộp khoảng trắng liền nhau — Fields mới giống split() của Python.",
  },
  {
    id: "g-l2-ord", lv: 2, t: "Số học byte",
    p: "Hai biểu thức: chỉ số 0–25 của chữ thường s[i]; byte ký tự thứ k của bảng chữ thường.",
    a: "s[i] - 'a'\nbyte('a' + k)",
    n: "Chỉ đúng với ASCII — chuỗi có dấu phải qua []rune.",
  },
  {
    id: "g-l2-conv", lv: 2, t: "strconv",
    p: "Hai dòng: số 123 thành chuỗi; chuỗi \"123\" thành int (xử lý cả err).",
    a: "s := strconv.Itoa(123)\nv, err := strconv.Atoi(\"123\")",
    n: "Atoi trả (int, error) — dấu hiệu đầu tiên của kiểu trả kép trong Go.",
  },
  {
    id: "g-l2-clean", lv: 2, t: "Chuẩn hoá chuỗi",
    p: "Một biểu thức: s sau khi bỏ khoảng trắng hai đầu và chuyển về chữ thường.",
    a: "strings.ToLower(strings.TrimSpace(s))",
  },

  // ===== Nền 3 — Slice =====
  {
    id: "g-l3-make", lv: 3, t: "make: len và cap",
    p: "Hai dòng khác nhau thế nào: make([]int, n) và make([]int, 0, n)?",
    a: "a := make([]int, n)     // len n, đã có n số 0 — GÁN a[i] được ngay\nb := make([]int, 0, n)  // len 0, cap n — chỉ APPEND, b[i] sẽ panic",
    n: "Nhầm hai dòng này là nguồn của cả panic index lẫn slice đầy số 0 thừa.",
  },
  {
    id: "g-l3-matrix", lv: 3, t: "Ma trận 2D",
    p: "Tạo ma trận g gồm m hàng × n cột toàn 0 — Go không có one-liner.",
    a: "g := make([][]int, m)\nfor i := range g {\n    g[i] = make([]int, n)\n}",
  },
  {
    id: "g-l3-appendpop", lv: 3, t: "Đuôi slice",
    p: "Ba thao tác: thêm x vào cuối a; đọc phần tử cuối; bỏ phần tử cuối.",
    a: "a = append(a, x)\nv := a[len(a)-1]\na = a[:len(a)-1]",
    n: "append trả slice MỚI — quên gán lại a = append(a, x) là lỗi kinh điển.",
  },
  {
    id: "g-l3-slicing", lv: 3, t: "Cắt & sao chép",
    p: "Ba biểu thức: 3 phần tử đầu của a; 3 phần tử cuối; bản sao độc lập của a.",
    a: "a[:3]\na[len(a)-3:]\nc := append([]int(nil), a...)",
    n: "Hai cái đầu vẫn CHIA SẺ mảng nền — chỉ cái thứ ba là tách hẳn.",
  },
  {
    id: "g-l3-sort", lv: 3, t: "sort.Ints / sort.Slice",
    p: "Hai dòng: sắp a tăng dần; sắp a giảm dần bằng sort.Slice.",
    a: "sort.Ints(a)\nsort.Slice(a, func(i, j int) bool { return a[i] > a[j] })",
    n: "Hàm less nhận CHỈ SỐ i, j — không phải giá trị.",
  },
  {
    id: "g-l3-sortmulti", lv: 3, t: "Khoá kép",
    p: "Sắp pts (mỗi phần tử []int{x, y}) theo x tăng dần, x bằng nhau thì y giảm dần.",
    a: "sort.Slice(pts, func(i, j int) bool {\n    if pts[i][0] != pts[j][0] {\n        return pts[i][0] < pts[j][0]\n    }\n    return pts[i][1] > pts[j][1]\n})",
  },
  {
    id: "g-l3-prefix", lv: 3, t: "Prefix sum",
    p: "Xây slice cộng dồn p của nums sao cho p[i] = tổng i phần tử đầu (p[0] = 0).",
    a: "p := make([]int, len(nums)+1)\nfor i, x := range nums {\n    p[i+1] = p[i] + x\n}",
    n: "Tổng đoạn nums[l..r] = p[r+1] - p[l].",
  },
  {
    id: "g-l3-max", lv: 3, t: "Max của slice",
    p: "Tìm giá trị lớn nhất trong nums bằng vòng lặp.",
    a: "best := nums[0]\nfor _, x := range nums[1:] {\n    if x > best {\n        best = x\n    }\n}",
    n: "Go 1.21+: slices.Max(nums) và max(a, b) builtin.",
  },

  // ===== Nền 4 — Map =====
  {
    id: "g-l4-basic", lv: 4, t: "Map cơ bản",
    p: "Bốn thao tác: tạo map string→int; gán m[k] = v; xoá key k; đếm số phần tử.",
    a: "m := make(map[string]int)\nm[k] = v\ndelete(m, k)\nlen(m)",
  },
  {
    id: "g-l4-commaok", lv: 4, t: "Comma-ok",
    p: "Viết cách phân biệt 'key k không tồn tại' với 'key k có giá trị 0' trong map m.",
    a: "v, ok := m[k]\nif !ok {\n    // k không tồn tại; v là zero value\n}",
    n: "Đọc m[k] trơn luôn trả zero value — comma-ok là cách duy nhất biết key có thật.",
  },
  {
    id: "g-l4-count", lv: 4, t: "Đếm tần suất",
    p: "Đếm tần suất ký tự (rune) của chuỗi s.",
    v: ["Xây map cnt: mỗi ký tự của s → số lần xuất hiện, tận dụng zero value."],
    a: "cnt := map[rune]int{}\nfor _, c := range s {\n    cnt[c]++\n}",
    n: "Zero value làm getOrDefault miễn phí — cnt[c]++ chạy được cả khi c chưa có.",
  },
  {
    id: "g-l4-set", lv: 4, t: "Set bằng map",
    p: "Go không có set — viết: tạo set; thêm x; kiểm tra x đã có chưa.",
    a: "seen := map[int]bool{}\nseen[x] = true\nif seen[x] {",
    n: "map[int]struct{}{} tiết kiệm bộ nhớ hơn nhưng phải dùng comma-ok để kiểm tra; bool tiện hơn cho phỏng vấn.",
  },
  {
    id: "g-l4-group", lv: 4, t: "Gom nhóm",
    p: "Gom các từ trong words theo byte đầu tiên vào map[byte][]string.",
    a: "m := map[byte][]string{}\nfor _, w := range words {\n    m[w[0]] = append(m[w[0]], w)\n}",
    n: "append vào nil slice hợp lệ (trả slice mới) — trái ngược với ghi vào nil map.",
  },
  {
    id: "g-l4-iter", lv: 4, t: "Duyệt map",
    p: "Viết vòng for duyệt map m lấy cả key và value. Thứ tự duyệt là gì?",
    a: "for k, v := range m {\n// Thứ tự NGẪU NHIÊN có chủ đích — cần thứ tự thì gom key ra slice rồi sort.",
  },
  {
    id: "g-l4-key", lv: 4, t: "Key tổng hợp",
    p: "Cần dùng toạ độ (r, c) làm key của map — viết cách đúng và nói vì sao KHÔNG dùng []int.",
    a: "type pt struct{ r, c int }\nm := map[pt]int{}\nm[pt{r, c}] = val\n// hoặc: map[[2]int]int — MẢNG so sánh được, SLICE thì không nên không làm key được.",
  },

  // ===== Nền 5 — Idiom LeetCode =====
  {
    id: "g-l5-swap", lv: 5, t: "Hoán đổi & đa gán",
    p: "Một dòng: hoán đổi a và b.",
    a: "a, b = b, a",
    n: "Đa gán của Go dùng được cả trong for hai con trỏ: i, j = i+1, j-1.",
  },
  {
    id: "g-l5-minmax", lv: 5, t: "Vô cực nguyên",
    p: "Khởi tạo best = int lớn nhất và worst = int nhỏ nhất.",
    a: "best := math.MaxInt\nworst := math.MinInt",
    n: "Go 1.17+. Trước đó: math.MaxInt64 với kiểu int64.",
  },
  {
    id: "g-l5-queue", lv: 5, t: "Hàng đợi BFS bằng slice",
    p: "Go không có deque sẵn — viết bộ thao tác BFS: khởi tạo với start, đẩy x, rút phần tử đầu.",
    a: "q := []int{start}\nq = append(q, x)\nv := q[0]\nq = q[1:]",
    n: "Đủ tốt cho phỏng vấn; q = q[1:] không thu hồi bộ nhớ đầu ngay — biết để trả lời khi bị hỏi.",
  },
  {
    id: "g-l5-heap", lv: 5, t: "container/heap",
    p: "Viết IntHeap (min-heap) đủ 5 method của interface, và 3 dòng dùng nó.",
    a: "type IntHeap []int\n\nfunc (h IntHeap) Len() int           { return len(h) }\nfunc (h IntHeap) Less(i, j int) bool { return h[i] < h[j] }\nfunc (h IntHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }\nfunc (h *IntHeap) Push(x any)        { *h = append(*h, x.(int)) }\nfunc (h *IntHeap) Pop() any {\n    old := *h\n    n := len(old)\n    x := old[n-1]\n    *h = old[:n-1]\n    return x\n}\n\nh := &IntHeap{}\nheap.Push(h, 3)\nv := heap.Pop(h).(int)",
    n: "Push/Pop nhận con trỏ và any — đây là khối đáng luyện tới mức viết không cần nghĩ, vì phỏng vấn Go nào cũng đụng.",
  },
  {
    id: "g-l5-closure", lv: 5, t: "DFS bằng closure đệ quy",
    p: "Trong thân một hàm, khai báo hàm dfs(u int) gọi đệ quy chính nó — viết đúng kiểu Go.",
    a: "var dfs func(u int)\ndfs = func(u int) {\n    ...\n    dfs(v)\n}",
    n: "Phải khai báo var trước rồi mới gán — closure không tự thấy tên chính nó khi dùng :=.",
  },
  {
    id: "g-l5-intdiv", lv: 5, t: "Chia nguyên cắt về 0",
    p: "Tính -7 / 2 và -7 % 2 trong Go.",
    a: "-7 / 2 == -3\n-7 % 2 == -1\n// Cắt về 0, giống Java/C++, KHÁC Python.",
  },
  {
    id: "g-l5-dirs", lv: 5, t: "Duyệt 4 hướng lưới",
    p: "Từ ô (x, y): sinh 4 ô kề và lọc những ô nằm trong biên lưới m × n.",
    a: "dirs := [4][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}\nfor _, d := range dirs {\n    nx, ny := x+d[0], y+d[1]\n    if nx >= 0 && nx < m && ny >= 0 && ny < n {\n        ...\n    }\n}",
  },
  {
    id: "g-l2-substr", lv: 2, t: "Cắt chuỗi con",
    p: "Lấy 'chuỗi con' của s từ l đến r-1 — và bẫy với tiếng Việt?",
    a: "s[l:r]   // cắt theo BYTE, nửa mở [l, r)\n// Chuỗi có dấu: cắt giữa rune sẽ vỡ ký tự —\n// an toàn Unicode: string([]rune(s)[l:r])",
  },
  {
    id: "g-l2-pal", lv: 2, t: "Palindrome",
    p: "Kiểm tra s là palindrome bằng two-pointer trên rune (Go không có đảo-rồi-so một dòng).",
    a: "r := []rune(s)\nfor i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {\n    if r[i] != r[j] {\n        return false\n    }\n}\nreturn true",
    n: "Two-pointer thoát sớm còn nhanh hơn đảo chuỗi đầy đủ — dùng lại được cho valid-palindrome có bỏ ký tự.",
  },
  {
    id: "g-l4-freqmax", lv: 4, t: "Key có value lớn nhất",
    p: "Tìm key có value lớn nhất trong map cnt (Go không có most_common).",
    a: "bestK, bestV := byte(0), -1\nfor k, v := range cnt {\n    if v > bestV {\n        bestK, bestV = k, v\n    }\n}",
    n: "Thứ tự duyệt map NGẪU NHIÊN — khi hoà, kết quả có thể đổi giữa các lần chạy; cần tất định thì thêm tie-break rõ ràng.",
  },
  {
    id: "g-l5-bit", lv: 5, t: "Bit cơ bản",
    p: "Năm biểu thức: kiểm tra x lẻ; chia đôi x; 2 mũ k; tắt bit 1 thấp nhất; XOR.",
    a: "x & 1\nx >> 1\n1 << k\nx & (x - 1)\nx ^ y   // Go còn có x &^ y (AND NOT — xoá các bit của y khỏi x)",
    n: "Go xếp & mạnh hơn == nên (x&1) == 0 không ngoặc vẫn đúng — là NGOẠI LỆ trong họ C; đổi ngôn ngữ là dính bẫy ưu tiên.",
  },
  {
    id: "g-l5-memo", lv: 5, t: "Nhớ hoá đệ quy",
    p: "Viết khung nhớ hoá cho f(k): slice memo khởi tạo -1, kết hợp closure đệ quy.",
    a: "memo := make([]int, n+1)\nfor i := range memo {\n    memo[i] = -1\n}\nvar f func(k int) int\nf = func(k int) int {\n    if memo[k] != -1 {\n        return memo[k]\n    }\n    kq := 0 /* tính */\n    memo[k] = kq\n    return kq\n}",
    n: "Key nhiều chiều: map[[2]int]int hoặc struct key (xem khối key tổng hợp). Go không có decorator kiểu @cache.",
  },
  {
    id: "g-l5-freq26", lv: 5, t: "Mảng đếm 26",
    p: "Đếm tần suất chữ thường (ASCII) của s bằng mảng 26 phần tử.",
    a: "var freq [26]int\nfor i := 0; i < len(s); i++ {\n    freq[s[i]-'a']++\n}",
    n: "[26]int là MẢNG — kiểu giá trị: truyền vào hàm là BẢN SAO (khác slice). Cần chia sẻ thì truyền *[26]int hoặc dùng slice.",
  },
];
