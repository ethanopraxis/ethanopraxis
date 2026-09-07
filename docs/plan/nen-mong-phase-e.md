# Track NM — Phase E: Deck v2 + Sổ đối xứng + Lint (Trục 1 ∪ Trục 2)

> Bổ sung cho docs/plans/nen-mong-port.md (v2). Phase A–C đã xong và đang chạy
> live. Phase E gộp hai phân tích độc lập: kiểm toán corpus (Trục 2 — bên
> ngoài, 16.513 lời giải) và kiểm tra đối xứng chéo deck (Trục 1 — bên trong,
> do Claude Code đề xuất). Hai trục hội tụ về cùng một lỗ (bit manipulation);
> Trục 1 còn phát hiện 23 bất đối xứng, trong đó 21 là LỆCH TÊN (khái niệm đã
> có dưới id khác) và 2 là lỗ thật ở TypeScript (prefix sum, đổi số↔chuỗi).

## Kickoff prompt (dán vào Claude Code)

```
Read docs/plans/nen-mong-phase-e.md fully before touching anything. This
phase ships deck v2 (authored and approved UPSTREAM — you still author no
drill content; KỴ 6 is amended per §2, not released) plus the symmetry lint
you proposed. Tasks: (1) replace the five deck files in src/data/nenmong/
with the provided v2 files and add the provided src/data/nenmong/concepts.ts;
(2) extend scripts/test-nenmong-engine.mjs with the symmetry lint per §4,
adapting the provided reference implementation lint-symmetry.mjs to the
repo's TS-loading mechanism from Phase C, and update expected deck counts to
py 46 · java 46 · go 46 · cpp 45 · ts 47 = 230; (3) run build + astro check +
test:nenmong until green; (4) QA per §5. One commit, message prefixed "nm:".
If any acceptance criterion cannot be met as written, stop and report
instead of improvising.
```

## §1. Files được cung cấp (thay thế / thêm mới — KHÔNG sửa nội dung)

```
src/data/nenmong/deck-python.ts       46 khối  (42 + 4)
src/data/nenmong/deck-java.ts         46 khối  (42 + 4)
src/data/nenmong/deck-go.ts           46 khối  (40 + 6)
src/data/nenmong/deck-cpp.ts          45 khối  (39 + 6)
src/data/nenmong/deck-typescript.ts   47 khối  (39 + 8)
src/data/nenmong/concepts.ts          sổ đối xứng: 35 dòng (ghi đè + na)
lint-symmetry.mjs                     bản tham chiếu của lint — chuyển vào
                                      scripts/test-nenmong-engine.mjs
```

Delta gồm hai nguồn, đều đã duyệt: **corpus** (bit ×5, dfs/bisect Python,
substring Java, lower_bound C++ — lưu ý đính chính: bản audit ghi "10 khối",
số đúng là 9) và **đối xứng** (memo Go/C++, freq26 ×4, argmax map ×3,
palindrome ×4, substring Go/TS, DFS Java/TS, prefix sum + đổi số↔chuỗi TS).
Kèm 5 chỉnh note nhỏ trong nội dung gốc (generator/MOD ở Python, sort.Search
ở Go, emplace ở C++, boolean[] ở Java) — tất cả do tác giả deck viết.

Mọi id CŨ giữ nguyên (đổi id = mồ côi tiến độ đã lưu). Khối mới chỉ APPEND
cuối mảng — thứ tự hiển thị không đổi vì UI nhóm theo lv.

## §2. Tu chính KỴ 6

KỴ 6 giữ nguyên mục đích: **Claude Code không bao giờ tự viết nội dung
drill.** Bổ sung kênh chính danh: nội dung mới đi theo đường *tác giả deck
viết → chủ kênh duyệt → giao file hoàn chỉnh → Claude Code thay file nguyên
khối (wholesale replace)*. Nghi ngờ lỗi nội dung: báo trong commit message,
không sửa.

## §3. concepts.ts — hợp đồng

Đã ghi trong doc-comment của file. Tóm tắt: kỷ luật đặt tên id là cơ chế đối
xứng chính (auto-group theo hậu tố sau khi bỏ tiền tố ^(j|g|c|t)-); các dòng
CONCEPTS ghi đè khi id lịch sử lệch tên hoặc khi một ngôn ngữ được miễn có
lý do (na). Một drill được phép xuất hiện ở nhiều dòng (khối đa diện, vd
j-l2-conv vừa "phân loại ký tự" vừa "đổi số↔chuỗi").

## §4. Lint đối xứng — luật (đã cài trong bản tham chiếu, giữ ĐÚNG ngữ nghĩa)

1. Kiểm tra cấu trúc mọi deck: id duy nhất, lv 0–5, t/p/a khác rỗng; tổng
   theo §1.
2. Mỗi dòng CONCEPTS phải đủ 5 ngôn ngữ; mọi cell drill phải trỏ id có thật.
   Cell drill hợp lệ ⇒ đánh dấu id đó là *đã vào sổ* (claimed).
3. Auto-group TẤT CẢ drill theo hậu tố. Với mỗi nhóm kích thước k:
   - k = 5 → đạt.
   - k = 1 → đạt nếu đã vào sổ; chưa thì WARN (đặc sản ngôn ngữ, ứng viên
     dòng na tương lai). Hiện có 33 WARN — chấp nhận được, KHÔNG chặn build.
   - 1 < k < 5 → đạt nếu MỌI thành viên đã vào sổ; ngược lại **FAIL** (bất
     đối xứng chưa giải thích).
4. Exit khác 0 khi có lỗi cấu trúc hoặc FAIL đối xứng. Trạng thái bàn giao:
   **0 FAIL**.

## §5. QA sau deploy (chủ kênh, ~5 phút)

1. Mỗi ngôn ngữ: các khối mới xuất hiện dạng nét đứt ('u') trên bản đồ; lời
   mời khảo sát TÁI XUẤT HIỆN cho phần chưa xây — đây là hành vi đúng của
   merge-on-load, không phải bug.
2. Các seal 井 hiện có KHÔNG đổi trạng thái; chỉ số gate của node cũ giữ
   nguyên.
3. Python: mở khối "List comprehension" và "Chia nguyên · dư · trần" — thấy
   note mới (generator / MOD).
4. TS: hai khối mới "Prefix sum" và "Đổi số ↔ chuỗi" xây được bình thường.

## §6. Ghi chú kỹ thuật còn nợ

- Nhận định "overflow không chạm tới ở Go" đúng một nửa: int của Go VẪN tràn
  nói chung, chỉ là không tràn được từ chỉ số mảng LC; deck Go vốn đã dùng
  dạng an toàn lo + (hi-lo)/2 nên không cần đổi gì.
- 33 WARN là danh sách nuôi sổ: mỗi lần review deck, chuyển vài khối đơn
  nhất thành dòng na có lý do. Không vội.

## §7. Nghiệm thu

- [ ] Build + astro check + test:nenmong xanh; lint báo 0 FAIL, tổng 230.
- [ ] Không file nào ngoài §1 và scripts/test-nenmong-engine.mjs bị sửa.
- [ ] Nội dung 5 deck + concepts.ts byte-identical với bản giao.
- [ ] QA §5 ghi nhận đạt.
