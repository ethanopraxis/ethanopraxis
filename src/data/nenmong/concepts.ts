import type { LangId } from "./index";

/**
 * Sổ đối xứng khái niệm (Trục 1).
 *
 * HỢP ĐỒNG VỚI LINT:
 * 1. Auto-group theo hậu tố id: bỏ tiền tố ngôn ngữ ^(j|g|c|t)- rồi gom các
 *    khối cùng hậu tố (vd: l1-bs, j-l1-bs, g-l1-bs, c-l1-bs, t-l1-bs = một
 *    khái niệm). Kỷ luật đặt tên id CHÍNH LÀ cơ chế đối xứng.
 * 2. Các dòng dưới đây GHI ĐÈ auto-group: dùng khi id lịch sử không khớp hậu
 *    tố (không đổi id — đổi id là mồ côi tiến độ đã lưu), hoặc khi một ngôn
 *    ngữ được miễn có lý do (na).
 * 3. Luật lint: với mỗi nhóm/dòng có khối ở k ngôn ngữ mà 1 < k < 5, các ngôn
 *    ngữ còn lại PHẢI có na — nếu không: FAIL (bất đối xứng chưa giải thích).
 *    k = 1: WARN (ứng viên cho dòng na mới). k = 5: đạt.
 */

export type ConceptCell = { drill: string } | { na: string };

export interface ConceptRow {
  concept: string;
  cells: Partial<Record<LangId, ConceptCell>>;
}

export const CONCEPTS: ConceptRow[] = [
  {
    concept: "dfs-de-quy-trong-ham",
    cells: {
      py: { drill: "l5-dfs" },
      java: { drill: "j-l5-dfs" },
      go: { drill: "g-l5-closure" },
      cpp: { drill: "c-l5-lambdarec" },
      ts: { drill: "t-l5-dfs" },
    },
  },
  {
    concept: "nho-hoa-de-quy",
    cells: {
      py: { drill: "l5-cache" },
      java: { drill: "j-l5-memo" },
      go: { drill: "g-l5-memo" },
      cpp: { drill: "c-l5-memo" },
      ts: { drill: "t-l5-memo" },
    },
  },
  {
    concept: "argmax-cua-map",
    cells: {
      py: { drill: "l4-common" },
      java: { drill: "j-l4-freqmax" },
      go: { drill: "g-l4-freqmax" },
      cpp: { drill: "c-l4-freqmax" },
      ts: { drill: "t-l4-freqmax" },
    },
  },
  {
    concept: "binary-search-thu-vien",
    cells: {
      py: { drill: "l5-bisect" },
      cpp: { drill: "c-l4-bound" },
      go: { na: "sort.Search đã ghi trong note của g-l1-bs — mức note là đủ." },
      java: {
        na: "Arrays.binarySearch trả điểm chèn mã hoá âm — trong LC tự viết bs rõ ràng hơn; không dạy làm idiom.",
      },
      ts: { na: "JS/TS không có binary search trong thư viện chuẩn." },
    },
  },
  {
    concept: "chuoi-con",
    cells: {
      py: { drill: "l3-slice" }, // slice là cú pháp chung cho list lẫn chuỗi
      java: { drill: "j-l2-substr" },
      go: { drill: "g-l2-substr" },
      cpp: { drill: "c-l2-substr" },
      ts: { drill: "t-l2-substr" },
    },
  },
  {
    concept: "ternary",
    cells: {
      py: { drill: "l1-tern" },
      java: { drill: "j-l1-tern" },
      go: { drill: "g-l1-noternary" }, // dạy SỰ VẮNG MẶT cũng là phủ khái niệm
      cpp: { drill: "c-l1-tern" },
      ts: { drill: "t-l1-tern" },
    },
  },
  {
    concept: "zip-duyet-song-song",
    cells: {
      py: { drill: "l1-zip" },
      java: { na: "Không có zip — duyệt song song bằng MỘT chỉ số chung; đã nằm trong khối for chỉ số." },
      go: { na: "Không có zip — một chỉ số chung; đã nằm trong khối for." },
      cpp: { na: "Không có zip (trước C++23) — một chỉ số chung." },
      ts: { na: "Không có zip — một chỉ số chung; map/entries đã dạy." },
    },
  },
  {
    concept: "for-else",
    cells: {
      py: { drill: "l1-forelse" },
      java: { na: "Ngôn ngữ không có for–else." },
      go: { na: "Ngôn ngữ không có for–else." },
      cpp: { na: "Ngôn ngữ không có for–else." },
      ts: { na: "Ngôn ngữ không có for–else." },
    },
  },
  {
    concept: "kiem-tra-bien-doc-lap",
    cells: {
      py: { drill: "l1-chain" }, // twist: chained comparison
      java: { drill: "j-l1-bounds" }, // twist: KHÔNG có chaining
      go: { na: "Không có twist ngôn ngữ riêng — biểu thức biên đã nằm trong khối dirs." },
      cpp: { na: "Không có twist ngôn ngữ riêng — đã nằm trong khối dirs." },
      ts: { na: "Không có twist ngôn ngữ riêng — đã nằm trong khối dirs." },
    },
  },
  {
    concept: "mong-tham-chieu-vs-gia-tri",
    cells: {
      py: { drill: "m-alias" },
      java: { drill: "j-m-arrayref" },
      go: { drill: "g-m-slicehdr" },
      cpp: { drill: "c-m-copy" }, // chiều NGƯỢC: mặc định sao chép
      ts: { drill: "t-m-ref" },
    },
  },
  {
    concept: "integer-cache",
    cells: {
      java: { drill: "j-m-intcache" },
      py: { na: "Hiện tượng riêng của autoboxing Java." },
      go: { na: "Hiện tượng riêng của autoboxing Java." },
      cpp: { na: "Hiện tượng riêng của autoboxing Java." },
      ts: { na: "Hiện tượng riêng của autoboxing Java." },
    },
  },
  {
    concept: "comma-ok",
    cells: {
      go: { drill: "g-l4-commaok" },
      py: { na: "Đặc sản Go — các ngôn ngữ khác kiểm tra tồn tại theo cách riêng đã dạy (in / containsKey / count / has)." },
      java: { na: "Đặc sản Go." },
      cpp: { na: "Đặc sản Go." },
      ts: { na: "Đặc sản Go." },
    },
  },
  // ---- Các dòng hoà giải tên (khái niệm đã có, id khác hậu tố) ----
  {
    concept: "chuoi-tach-noi",
    cells: {
      py: { drill: "l2-splitjoin" }, java: { drill: "j-l2-splitjoin" },
      go: { drill: "g-l2-splitjoin" }, cpp: { drill: "c-l2-split" },
      ts: { drill: "t-l2-splitjoin" },
    },
  },
  {
    concept: "xay-chuoi-hieu-qua",
    cells: {
      py: { drill: "l2-build" }, java: { drill: "j-l2-sb" },
      go: { drill: "g-l2-builder" }, cpp: { drill: "c-l2-build" },
      ts: { drill: "t-l2-build" },
    },
  },
  {
    concept: "dao-chuoi",
    cells: {
      py: { drill: "l2-revs" }, java: { drill: "j-l2-reverse" },
      go: { drill: "g-l2-reverse" }, cpp: { drill: "c-l2-mutable" },
      ts: { drill: "t-l2-rev" },
    },
  },
  {
    concept: "so-hoc-ky-tu",
    cells: {
      py: { drill: "l2-ord" }, java: { drill: "j-l2-ord" },
      go: { drill: "g-l2-ord" }, cpp: { drill: "c-l2-ord" },
      ts: { drill: "t-l2-char" },
    },
  },
  {
    concept: "phan-loai-ky-tu",
    cells: {
      py: { drill: "l2-chars" }, java: { drill: "j-l2-conv" },
      go: { drill: "g-l2-conv" }, cpp: { drill: "c-l2-conv" },
      ts: { drill: "t-l2-clean" },
    },
  },
  {
    concept: "duyet-ky-tu",
    cells: {
      java: { drill: "j-l2-chars" },
      py: { na: "Chuỗi iterable trực tiếp: for c in s — không cần chuyển đổi." },
      go: { na: "range s cho rune trực tiếp — đã dạy ở Móng byte/rune." },
      cpp: { na: "range-for duyệt chuỗi trực tiếp — đã dạy ở khối range-for." },
      ts: { na: "for...of duyệt chuỗi trực tiếp — đã dạy ở khối for...of." },
    },
  },
  {
    concept: "chuan-hoa-chuoi",
    cells: {
      py: { drill: "l2-clean" }, go: { drill: "g-l2-clean" }, ts: { drill: "t-l2-clean" },
      java: { na: "s.trim().toLowerCase() — cùng khuôn, không có bẫy riêng." },
      cpp: { na: "Không có trim/lower builtin — transform + ::tolower khi cần, hiếm gặp trong LC." },
    },
  },
  {
    concept: "doi-so-chuoi",
    cells: {
      java: { drill: "j-l2-conv" }, go: { drill: "g-l2-conv" },
      cpp: { drill: "c-l2-conv" }, ts: { drill: "t-l2-conv" },
      py: { na: "str() / int() trơn, không có bẫy đáng drill." },
    },
  },
  {
    concept: "sort-co-ban",
    cells: {
      py: { drill: "l3-sortkey" }, java: { drill: "j-l3-sort" },
      go: { drill: "g-l3-sort" }, cpp: { drill: "c-l3-sort" },
      ts: { drill: "t-l3-sortnum" },
    },
  },
  {
    concept: "sort-khoa-kep",
    cells: {
      py: { drill: "l3-sortmulti" }, java: { drill: "j-l3-sortcmp" },
      go: { drill: "g-l3-sortmulti" }, cpp: { drill: "c-l3-sortlambda" },
      ts: { drill: "t-l3-sortmulti" },
    },
  },
  {
    concept: "khoi-tao-mang-1d",
    cells: {
      java: { drill: "j-l3-init" }, cpp: { drill: "c-l3-init" },
      ts: { drill: "t-l3-init" }, go: { drill: "g-l3-make" },
      py: { na: "[v] * n an toàn ở 1 chiều (bẫy chỉ khi lồng — xem Móng); đã có mặt trong khối Mảng đếm 26." },
    },
  },
  {
    concept: "duoi-mang",
    cells: {
      py: { drill: "l3-last" }, java: { drill: "j-l3-list" },
      go: { drill: "g-l3-appendpop" }, cpp: { drill: "c-l3-pushpop" },
      ts: { drill: "t-l3-pushpop" },
    },
  },
  {
    concept: "prefix-sum",
    cells: {
      py: { drill: "l3-prefix" }, java: { drill: "j-l3-prefix" },
      go: { drill: "g-l3-prefix" }, cpp: { drill: "c-l3-prefix" },
      ts: { drill: "t-l3-prefix" },
    },
  },
  {
    concept: "max-cua-mang",
    cells: {
      py: { drill: "l3-maxidx" }, java: { drill: "j-l3-max" },
      go: { drill: "g-l3-max" }, cpp: { drill: "c-l3-maxmin" },
      ts: { drill: "t-l3-reduce" },
    },
  },
  {
    concept: "gom-nhom",
    cells: {
      py: { drill: "l4-dd" }, java: { drill: "j-l4-computeif" },
      go: { drill: "g-l4-group" }, ts: { drill: "t-l4-group" },
      cpp: { drill: "c-l4-count" }, // operator[] tự tạo — m[k].push_back(w) là cùng cơ chế
    },
  },
  {
    concept: "key-tong-hop",
    cells: {
      py: { drill: "l4-hash" }, java: { drill: "j-l4-key" },
      go: { drill: "g-l4-key" }, cpp: { drill: "c-l4-key" },
      ts: { drill: "t-l2-template" },
    },
  },
  {
    concept: "cuc-tri-khoi-tao",
    cells: {
      py: { drill: "l5-inf" }, ts: { drill: "t-l5-inf" },
      java: { drill: "j-l5-minmax" }, go: { drill: "g-l5-minmax" },
      cpp: { drill: "c-l5-minmax" },
    },
  },
  {
    concept: "hang-doi-bfs",
    cells: {
      py: { drill: "l5-deque" }, java: { drill: "j-l5-deque" },
      go: { drill: "g-l5-queue" }, cpp: { drill: "c-l5-queue" },
      ts: { drill: "t-l5-queue" },
    },
  },
  {
    concept: "heap",
    cells: {
      py: { drill: "l5-heap" }, go: { drill: "g-l5-heap" },
      ts: { drill: "t-l5-heap" }, java: { drill: "j-l5-pq" },
      cpp: { drill: "c-l5-pq" },
    },
  },
  {
    concept: "chia-nguyen-so-am",
    cells: {
      java: { drill: "j-m-intdiv" }, cpp: { drill: "c-m-intdiv" },
      go: { drill: "g-l5-intdiv" }, py: { drill: "l5-divmod" },
      ts: { drill: "t-m-number" },
    },
  },
  {
    concept: "for-chi-so",
    cells: {
      java: { drill: "j-l1-forindex" }, go: { drill: "g-l1-classic" },
      cpp: { drill: "c-l1-classic" }, ts: { drill: "t-l1-rev" },
      py: { na: "for i in range(n) — không có bẫy; xuất hiện xuyên suốt các khối khác." },
    },
  },
  {
    concept: "cat-doan-mang",
    cells: {
      py: { drill: "l3-slice" }, ts: { drill: "t-l3-slice" },
      go: { drill: "g-l3-slicing" }, java: { drill: "j-l3-copy" },
      cpp: { na: "Cắt vector = vector(v.begin()+l, v.begin()+r) — LC thường thao tác trên chỉ số, hiếm cần bản cắt." },
    },
  },
  {
    concept: "truyen-tham-so-container",
    cells: {
      cpp: { drill: "c-m-ref" },
      py: { na: "Mọi biến là tham chiếu đối tượng — không có lựa chọn truyền, đã nằm trong Móng alias." },
      java: { na: "Object luôn truyền tham chiếu, primitive theo giá trị — đã ngầm trong Móng mảng-là-object." },
      go: { na: "Slice/map là header chia sẻ mảng nền — đã nằm trong Móng slice header." },
      ts: { na: "Object/mảng luôn truyền tham chiếu — đã nằm trong Móng tham chiếu." },
    },
  },
];
