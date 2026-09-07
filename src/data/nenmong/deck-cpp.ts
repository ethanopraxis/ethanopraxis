import type { Drill } from "../../lib/nenmong/types";

export const LEVELS: string[] = [
  "Móng — cơ chế",
  "Nền 1 — Vòng lặp",
  "Nền 2 — Chuỗi",
  "Nền 3 — Vector",
  "Nền 4 — Map · Set",
  "Nền 5 — Idiom LeetCode",
];

export const DECK: Drill[] = [
  // ===== MÓNG =====
  {
    id: "c-m-copy", lv: 0, t: "Ngữ nghĩa GIÁ TRỊ",
    p: "Dự đoán output — và so với Python/Java thì ngược ở chỗ nào?",
    pc: "vector<int> a = {1, 2, 3};\nauto b = a;\nb[0] = 9;\ncout << a[0];",
    a: "1\n// C++ gán là SAO CHÉP giá trị (ngược Python/Java: mặc định tham chiếu).\n// Muốn cùng trỏ một vector: auto& r = a;",
  },
  {
    id: "c-m-ref", lv: 0, t: "Vì sao tham số dùng &",
    p: "Hai chữ ký khác nhau thế nào, và vì sao LeetCode luôn viết kiểu thứ hai?\nvoid f(vector<int> v)\nvoid f(const vector<int>& v)",
    a: "Kiểu 1: SAO CHÉP cả vector khi gọi — O(n) mỗi lần.\nKiểu 2: mượn tham chiếu, không copy; const cam kết không sửa.\n// Truyền container luôn dùng const T& (hoặc T& nếu cần sửa).",
  },
  {
    id: "c-m-overflow", lv: 0, t: "Tràn int",
    p: "int chứa tối đa khoảng bao nhiêu? 1e9 + 1e9 trong int thì sao? Viết mid an toàn của binary search.",
    a: "int ~ 2.1e9 (2^31 - 1). 1e9 + 1e9 tràn — hành vi không xác định.\n// Tổng/tích lớn: dùng long long.\nint mid = lo + (hi - lo) / 2;",
  },
  {
    id: "c-m-intdiv", lv: 0, t: "Chia nguyên cắt về 0",
    p: "Tính -7 / 2 và -7 % 2 trong C++.",
    a: "-7 / 2 == -3\n-7 % 2 == -1\n// Cắt về 0, KHÁC Python (làm tròn về âm vô cực).",
  },
  {
    id: "c-m-bigo", lv: 0, t: "Đếm phép toán → Big-O",
    p: "Thân vòng lặp trong chạy tổng cộng bao nhiêu lần? Suy ra Big-O:",
    pc: "for (int i = 0; i < n; i++)\n    for (int j = i + 1; j < n; j++)\n        ...",
    a: "(n-1) + (n-2) + ... + 1 = n(n-1)/2  →  O(n²)",
    n: "Big-O là kết quả của việc ĐẾM, không phải bảng để thuộc lòng.",
  },
  {
    id: "c-m-recur", lv: 0, t: "Đệ quy = ngăn xếp",
    p: "f(3) in ra gì? Giải thích thứ tự bằng một câu:",
    pc: "void f(int n) {\n    if (n == 0) return;\n    f(n - 1);\n    cout << n << \"\\n\";\n}",
    a: "In: 1, 2, 3 (mỗi số một dòng)\n// cout nằm SAU lời gọi đệ quy nên chạy lúc ngăn xếp bung ra —\n// lời gọi sâu nhất in trước.",
  },

  // ===== Nền 1 — Vòng lặp =====
  {
    id: "c-l1-rangefor", lv: 1, t: "Range-for và auto&",
    p: "Hai dòng for: duyệt giá trị của nums; duyệt để SỬA từng phần tử tại chỗ.",
    a: "for (int x : nums)\nfor (int& x : nums)",
    n: "Với phần tử nặng (string, vector) dùng const auto& để khỏi copy từng vòng.",
  },
  {
    id: "c-l1-classic", lv: 1, t: "for theo chỉ số",
    p: "Viết dòng for duyệt nums theo chỉ số i — xử lý đúng chuyện size() là unsigned.",
    a: "int n = nums.size();\nfor (int i = 0; i < n; i++)",
    n: "So i (int) với nums.size() (size_t) sinh cảnh báo signed/unsigned — gán n ra int trước là gọn nhất.",
  },
  {
    id: "c-l1-rev", lv: 1, t: "Duyệt ngược",
    p: "Viết dòng for duyệt chỉ số của nums từ cuối về đầu.",
    a: "for (int i = (int)nums.size() - 1; i >= 0; i--)",
    n: "Dùng size_t i ở đây là vòng lặp VÔ HẠN — i >= 0 luôn đúng với unsigned.",
  },
  {
    id: "c-l1-tern", lv: 1, t: "Ternary",
    p: "Một dòng: gán nhan = \"chan\" nếu x chẵn, ngược lại \"le\".",
    a: "string nhan = x % 2 == 0 ? \"chan\" : \"le\";",
  },
  {
    id: "c-l1-bs", lv: 1, t: "Khung binary search",
    p: "Viết thân hàm binary search trên nums đã sắp xếp: trả về chỉ số của target, không có thì trả -1.",
    a: "int lo = 0, hi = nums.size() - 1;\nwhile (lo <= hi) {\n    int mid = lo + (hi - lo) / 2;\n    if (nums[mid] == target) return mid;\n    if (nums[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n}\nreturn -1;",
  },

  // ===== Nền 2 — Chuỗi =====
  {
    id: "c-l2-mutable", lv: 2, t: "Chuỗi SỬA được",
    p: "Hai dòng: đổi ký tự thứ i của s thành 'x'; đảo ngược s tại chỗ.",
    a: "s[i] = 'x';\nreverse(s.begin(), s.end());",
    n: "string C++ mutable — khác hẳn Python/Java. reverse tại chỗ, không tạo chuỗi mới.",
  },
  {
    id: "c-l2-substr", lv: 2, t: "substr",
    p: "Lấy chuỗi con của s bắt đầu tại pos, dài len.",
    a: "s.substr(pos, len)",
    n: "Tham số là (vị trí, ĐỘ DÀI) — không phải (l, r) như slice.",
  },
  {
    id: "c-l2-build", lv: 2, t: "Nối chuỗi",
    p: "Ghép nhiều ký tự/mảnh trong vòng lặp vào chuỗi kq — cách C++.",
    a: "string kq;\nfor (char c : s) kq += c;   // hoặc kq.push_back(c);",
    n: "Khác Java/Python: += của std::string là amortized O(1) — nối thẳng là idiomatic, không cần builder.",
  },
  {
    id: "c-l2-conv", lv: 2, t: "Đổi kiểu & phân loại",
    p: "Bốn biểu thức: số 123 thành chuỗi; chuỗi \"123\" thành int; c là chữ số?; c là chữ cái?",
    a: "to_string(123)\nstoi(\"123\")\nisdigit(c)\nisalpha(c)",
  },
  {
    id: "c-l2-ord", lv: 2, t: "Số học ký tự",
    p: "Hai biểu thức: chỉ số 0–25 của chữ thường c; ký tự thứ k của bảng chữ thường.",
    a: "c - 'a'\n(char)('a' + k)",
  },
  {
    id: "c-l2-split", lv: 2, t: "Tách từ bằng stringstream",
    p: "C++ không có split sẵn — tách câu s thành vector các từ theo khoảng trắng.",
    a: "stringstream ss(s);\nstring w;\nvector<string> words;\nwhile (ss >> w) words.push_back(w);",
    n: ">> tự gộp mọi khoảng trắng — hành vi giống split() của Python.",
  },

  // ===== Nền 3 — Vector =====
  {
    id: "c-l3-init", lv: 3, t: "Khởi tạo vector",
    p: "Hai dòng: vector n số 0; vector n phần tử đều bằng -1.",
    a: "vector<int> v(n);\nvector<int> v(n, -1);",
  },
  {
    id: "c-l3-matrix", lv: 3, t: "Ma trận 2D",
    p: "Một dòng: tạo ma trận m hàng × n cột toàn 0.",
    a: "vector<vector<int>> g(m, vector<int>(n, 0));",
    n: "Nhờ ngữ nghĩa giá trị, mỗi hàng là BẢN SAO riêng — không có bẫy alias như Python.",
  },
  {
    id: "c-l3-pushpop", lv: 3, t: "Đuôi vector",
    p: "Ba thao tác: thêm x vào cuối v; đọc phần tử cuối; bỏ phần tử cuối.",
    a: "v.push_back(x);\nv.back();\nv.pop_back();",
    n: "pop_back trả VOID — muốn lấy giá trị phải back() trước rồi mới pop_back().",
  },
  {
    id: "c-l3-sort", lv: 3, t: "Sắp xếp",
    p: "Hai dòng: sắp v tăng dần; sắp v giảm dần.",
    a: "sort(v.begin(), v.end());\nsort(v.begin(), v.end(), greater<int>());",
    n: "Giảm dần còn viết được: sort(v.rbegin(), v.rend());",
  },
  {
    id: "c-l3-sortlambda", lv: 3, t: "Sort với lambda",
    p: "Sắp pts (vector<vector<int>>, mỗi phần tử {x, y}) theo x tăng dần, x bằng nhau thì y giảm dần.",
    a: "sort(pts.begin(), pts.end(), [](const auto& p, const auto& q) {\n    if (p[0] != q[0]) return p[0] < q[0];\n    return p[1] > q[1];\n});",
    n: "Comparator trả true khi p đứng TRƯỚC q — và phải là thứ tự chặt (đừng dùng <=).",
  },
  {
    id: "c-l3-maxmin", lv: 3, t: "max_element",
    p: "Hai biểu thức: giá trị lớn nhất của v; CHỈ SỐ của phần tử lớn nhất.",
    a: "*max_element(v.begin(), v.end())\nmax_element(v.begin(), v.end()) - v.begin()",
    n: "max_element trả iterator — dereference lấy giá trị, trừ begin() lấy chỉ số.",
  },
  {
    id: "c-l3-accumulate", lv: 3, t: "accumulate",
    p: "Tính tổng của v — viết cả phiên bản an toàn khi tổng vượt int.",
    a: "int s = accumulate(v.begin(), v.end(), 0);\nlong long S = accumulate(v.begin(), v.end(), 0LL);",
    n: "Kiểu của tham số thứ ba quyết định kiểu cộng dồn — 0 là int, tổng lớn lặng lẽ tràn; 0LL mới an toàn.",
  },
  {
    id: "c-l3-prefix", lv: 3, t: "Prefix sum",
    p: "Xây mảng cộng dồn p của nums sao cho p[i] = tổng i phần tử đầu (p[0] = 0).",
    a: "vector<long long> p(nums.size() + 1);\nfor (int i = 0; i < (int)nums.size(); i++)\n    p[i + 1] = p[i] + nums[i];",
    n: "Tổng đoạn nums[l..r] = p[r+1] - p[l].",
  },

  // ===== Nền 4 — Map · Set =====
  {
    id: "c-l4-count", lv: 4, t: "Đếm tần suất",
    p: "Đếm tần suất ký tự của chuỗi s bằng unordered_map.",
    v: ["Xây map cnt: mỗi ký tự của s → số lần xuất hiện, tận dụng operator[]."],
    a: "unordered_map<char, int> cnt;\nfor (char c : s) cnt[c]++;",
    n: "operator[] tự tạo phần tử với giá trị 0 nếu chưa có — giống zero value của Go.",
  },
  {
    id: "c-l4-find", lv: 4, t: "Kiểm tra tồn tại",
    p: "Hai cách kiểm tra key k có trong map m — và vì sao KHÔNG dùng m[k] để kiểm tra.",
    a: "if (m.count(k))\nif (m.find(k) != m.end())\n// m[k] để kiểm tra là SAI: nó CHÈN k với giá trị mặc định nếu chưa có.",
  },
  {
    id: "c-l4-iter", lv: 4, t: "Duyệt map",
    p: "Viết vòng for duyệt map m lấy cả key và value (C++17).",
    a: "for (auto& [k, v] : m)",
    n: "Structured bindings — trước C++17 phải viết p.first / p.second.",
  },
  {
    id: "c-l4-set", lv: 4, t: "unordered_set",
    p: "Ba thao tác: tạo set rỗng tên seen; thêm x; kiểm tra x đã có chưa.",
    a: "unordered_set<int> seen;\nseen.insert(x);\nif (seen.count(x))",
  },
  {
    id: "c-l4-sorted", lv: 4, t: "map/set có thứ tự",
    p: "Khi nào dùng map/set thay vì unordered_*? Viết: phần tử nhỏ nhất của set<int> st; phần tử đầu tiên ≥ x.",
    a: "// Khi cần THỨ TỰ: min/max, lower_bound, duyệt tăng dần. (Cây đỏ-đen, O(log n).)\n*st.begin()\nauto it = st.lower_bound(x);",
  },
  {
    id: "c-l4-key", lv: 4, t: "Key là cặp",
    p: "Cần dùng toạ độ (r, c) làm key — viết cách chạy được ngay, và nói bẫy của unordered_map ở đây.",
    a: "map<pair<int,int>, int> m;\nm[{r, c}] = val;\n// unordered_map<pair<..>,..> KHÔNG compile — pair không có hash mặc định.\n// Mẹo phỏng vấn: key = (long long)r * 100000 + c với unordered_map<long long, int>.",
  },
  {
    id: "c-l4-erase", lv: 4, t: "Xoá phần tử",
    p: "Hai dòng: xoá key k khỏi map m; xoá giá trị x khỏi set st.",
    a: "m.erase(k);\nst.erase(x);",
  },

  // ===== Nền 5 — Idiom LeetCode =====
  {
    id: "c-l5-pair", lv: 5, t: "pair & structured bindings",
    p: "Ba dòng: tạo pair (d, u); tách nó ra hai biến bằng C++17; tạo nhanh trong biểu thức.",
    a: "pair<int, int> p = {d, u};\nauto [dd, uu] = p;\npq.push({d, u});",
  },
  {
    id: "c-l5-swap", lv: 5, t: "swap & min/max nhiều giá trị",
    p: "Hai dòng: hoán đổi a và b; lấy min của ba số a, b, c.",
    a: "swap(a, b);\nint m = min({a, b, c});",
  },
  {
    id: "c-l5-minmax", lv: 5, t: "Vô cực nguyên",
    p: "Khởi tạo best = int lớn nhất, worst = int nhỏ nhất (climits).",
    a: "int best = INT_MAX;\nint worst = INT_MIN;",
    n: "Cộng dồn quanh INT_MAX là tràn — chuyển long long (LLONG_MAX) sớm.",
  },
  {
    id: "c-l5-queue", lv: 5, t: "queue cho BFS",
    p: "Bốn dòng: tạo queue chứa sẵn start; đẩy x; lấy phần tử đầu ra v; bỏ nó khỏi queue.",
    a: "queue<int> q;\nq.push(start);\nint v = q.front();\nq.pop();",
    n: "front() rồi pop() — HAI bước, vì pop() trả void. Quên front() là bug kinh điển.",
  },
  {
    id: "c-l5-pq", lv: 5, t: "priority_queue",
    p: "Ba dòng: max-heap int; min-heap int; min-heap các pair (dist, node).",
    a: "priority_queue<int> maxH;                                  // MẶC ĐỊNH là MAX-heap\npriority_queue<int, vector<int>, greater<int>> minH;\npriority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;",
    n: "Ngược với Python/Java (mặc định min) — quên greater<> là Dijkstra chạy ngược.",
  },
  {
    id: "c-l5-lambdarec", lv: 5, t: "DFS bằng lambda đệ quy",
    p: "Trong thân một hàm, khai báo dfs(u) gọi đệ quy chính nó và thấy được biến xung quanh.",
    a: "function<void(int)> dfs = [&](int u) {\n    ...\n    dfs(v);\n};",
    n: "Lambda thường không tự gọi được chính nó — bọc trong std::function và capture [&] là idiom LeetCode.",
  },
  {
    id: "c-l5-dirs", lv: 5, t: "Duyệt 4 hướng lưới",
    p: "Từ ô (x, y): sinh 4 ô kề và lọc những ô nằm trong biên lưới m × n.",
    a: "int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};\nfor (auto& d : dirs) {\n    int nx = x + d[0], ny = y + d[1];\n    if (nx >= 0 && nx < m && ny >= 0 && ny < n) {\n        ...\n    }\n}",
  },
];
