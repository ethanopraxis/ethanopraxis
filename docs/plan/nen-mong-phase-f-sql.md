# Track NM — Phase F: Track SQL + Grader bằng chứng (sql.js)

> Bổ sung cho docs/plans/nen-mong-port.md (v2) và nen-mong-phase-e.md.
> SQL là một NGÔN NGỮ nên nó vào thẳng mô hình LangId hiện có làm track thứ
> sáu — phần tổng quát hoá "Track" trong blueprint để dành cho System Design.
> Cái mới duy nhất về kỹ thuật là grader. Deck 37 khối được cung cấp và ĐÃ
> được máy chứng thực: 31 đáp án chạy thật trên seed, 19 khẳng định số dòng,
> cặp corr≡CTE so multiset trùng khớp — đúng phép so grader sẽ dùng.

## Kickoff prompt (dán vào Claude Code)

```
Read docs/plans/nen-mong-phase-f-sql.md fully before touching anything. This
phase adds the SQL track. Deck content is PROVIDED and machine-verified —
you author no drill content (KỴ 6 channel per Phase E §2). Tasks: (1) place
the provided deck-sql.ts in src/data/nenmong/ and apply the provided
types.ts / index.ts updates (reconcile with any repo drift; the deck file
itself is byte-identical, the other two are reference diffs); (2) implement
src/lib/nenmong/sqlgrader.ts per §3 with sql.js, lazy-loaded only for the
SQL track; (3) add the verdict-evidence line to the Đối chiếu view per §4 —
the three grade buttons remain human-only; (4) extend
scripts/test-nenmong-engine.mjs per §5: scope the symmetry lint to the five
DSA decks (reference lint-symmetry.mjs provided), update totals to 267, and
add the SQL canonical-execution test that runs every drill.sql answer in
node; (5) build + astro check + test:nenmong green, then QA §6. One commit,
prefixed "nm:". If any acceptance criterion cannot be met as written, stop
and report.
```

## §1. Files được cung cấp

```
src/data/nenmong/deck-sql.ts     37 khối (6/6/6/7/6/6 theo level) + SETUPS + LEVELS
src/lib/nenmong/types.ts         bản cập nhật: Drill.sql?: { setup; ordered? }
src/data/nenmong/index.ts        bản cập nhật: LangId + "sql"; LangDef.grader?;
                                 entry { id:"sql", grader:"sqlite" }
lint-symmetry.mjs                bản lint đã giới hạn đối xứng vào 5 deck DSA
```

types.ts và index.ts là *diff tham chiếu* — nếu repo đã trôi, áp cùng những
bổ sung đó lên bản repo. deck-sql.ts là nội dung: byte-identical, KỴ 6.

## §2. Phụ thuộc

- `sql.js@^1.10` (SQLite WASM; window functions có sẵn — SQLite ≥ 3.25).
- WASM qua Vite: `import wasmUrl from "sql.js/dist/sql-wasm.wasm?url"` rồi
  `initSqlJs({ locateFile: () => wasmUrl })`.
- **Lazy tuyệt đối:** module grader chỉ được `import()` động khi track hiện
  tại có `grader === "sqlite"`. Năm track DSA không tải thêm một byte nào.
  Prefetch không chặn UI khi người dùng vừa chọn track SQL.

## §3. sqlgrader.ts — đặc tả

```ts
export type Verdict =
  | { status: "match"; rows: number }
  | { status: "diff"; expectedRows: number; gotRows: number; hint: string }
  | { status: "error"; message: string };

export async function checkSql(drill: Drill, userSql: string): Promise<Verdict>;
```

Quy tắc (test §5 khoá các quy tắc này lại):

1. Mỗi lần so: DB in-memory MỚI cho mỗi query (chạy SETUPS[drill.sql.setup]
   rồi query) — không rò trạng thái giữa hai lần chạy.
2. Lấy result set CUỐI CÙNG nếu người dùng gõ nhiều câu; canonical là một
   câu.
3. So SỐ CỘT theo vị trí; BỎ QUA tên cột (bí danh khác nhau vẫn khớp).
4. Chuẩn hoá ô: null giữ nguyên là null (khác 0, khác ""); số so bằng
   |a − b| < 1e-6 (AVG/ROUND cho REAL); còn lại so nghiêm ngặt.
5. Mặc định so MULTISET dòng (đếm theo khoá dòng chuẩn hoá); khi
   `drill.sql.ordered === true` thì so theo THỨ TỰ mảng.
6. `hint` của diff: 1 dòng thiếu đầu tiên hoặc 1 dòng thừa đầu tiên, dạng
   chuỗi gọn.
7. Lỗi cú pháp/chạy của USER → status "error" kèm message gốc của SQLite —
   đó là feedback thật, không phải thất bại của grader. Lỗi của CANONICAL →
   throw (để test §5 bắt được nội dung hỏng).

## §4. UI — dòng bằng chứng (chỉ track có grader)

- Vị trí: ngay TRÊN khối diff trong màn Đối chiếu (build, gate, và khảo
  sát dùng chung view — hiện ở cả ba).
- Trạng thái: `đang chạy…` → `✅ Kết quả khớp (n dòng)` / `❌ Kết quả khác —
  chuẩn n dòng, của bạn m dòng; lệch đầu tiên: …` / `⚠ Lỗi SQL: <message>`.
- Khối Móng (không có `drill.sql`) không hiện dòng này — tự chấm thuần như cũ.
- **Ba nút Đúng/Lệch/Sai vẫn do NGƯỜI bấm — máy không bao giờ tự chấm.**
  Đây là Điều 16 trong giao diện: máy đưa bằng chứng, người giữ quyền phán
  đoán. Style: token nm- hiện có, không thêm ngôn ngữ thị giác mới.

## §5. Test mở rộng (scripts/test-nenmong-engine.mjs)

1. Thay khối lint đối xứng bằng bản đã giới hạn (tham chiếu
   lint-symmetry.mjs): SYMMETRY = 5 id DSA; deck sql chỉ qua lint cấu trúc.
   Tổng mới: py 46 · java 46 · go 46 · cpp 45 · ts 47 · sql 37 = **267**.
2. **Test thực thi canonical SQL** (sql.js chạy được trong node): với MỌI
   khối có `drill.sql` — dựng DB từ setup, chạy đáp án chuẩn, khẳng định
   không lỗi và ≥ 0 dòng; riêng cặp (q-l4-corr, q-l4-cte) khẳng định hai
   multiset TRÙNG NHAU (đây là bài test của chính phép so).
3. Unit test hàm so sánh: khớp bất kể thứ tự khi ordered=false; lệch thứ tự
   bị bắt khi ordered=true; 2500 vs 2500.0 khớp (tolerance); null ≠ 0 ≠ "";
   khác số cột → diff; bí danh cột khác nhau → vẫn khớp.

## §6. QA (chủ kênh, ~7 phút)

1. Chọn track SQL → khảo sát mời như thường; deck 37 khối, 6 level đúng tên.
2. Khối q-l1-select: gõ đúng nhưng đổi bí danh cột → ✅ khớp (tên cột được
   bỏ qua).
3. Khối q-l1-order: gõ đúng dữ liệu nhưng ORDER BY ngược → ❌ (ordered bắt
   thứ tự).
4. Khối q-l3-avg: quên ROUND → ❌ với hint số lệch (2666.666… vs 2667).
5. Gõ SQL sai cú pháp → ⚠ lỗi hiển thị message; vẫn bấm Sai được, journal
   ghi như thường.
6. Khối Móng q-m-null: KHÔNG có dòng bằng chứng — tự chấm thuần.
7. Network tab ở track Python: KHÔNG có sql-wasm nào được tải; chuyển sang
   SQL mới thấy tải một lần.
8. 380 px: dòng bằng chứng xuống dòng gọn, không tràn ngang.
9. Ba nút chấm không bao giờ tự bấm; seal/gate/journal vận hành y các track
   khác (engine không đổi).

## §7. Đại Kỵ của phase này

- **KỴ 1 — Máy tự chấm.** Verdict là bằng chứng; mọi grade vẫn qua tay
  người. Không auto-submit, không disable nút theo verdict.
- **KỴ 2 — Chở wasm sang track khác.** Vi phạm lazy-load là fail acceptance.
- **KỴ 3 — Dialect creep.** Runtime SQLite, viết chuẩn ANSI; khác biệt MySQL
  chỉ nằm trong note. Không thêm cú pháp ngoài SQLite vào đáp án.
- **KỴ 4 — SELECT-only.** v1 không có drill INSERT/UPDATE/DDL (chấm chúng
  cần so trạng thái bảng — để Phase sau nếu cần).
- **KỴ 5 — Nội dung.** deck-sql.ts final; nghi lỗi thì báo, không sửa.

## §8. Ngoài phạm vi (đừng dựng sẵn)

DML/DDL grading · EXPLAIN/chỉ số hiệu năng · schema visualizer · so sánh
tuỳ biến theo khối · nav link/public launch (track vẫn unlisted như toàn
trang) · nhập bài LC thật.

## §9. Nghiệm thu

- [ ] Build + astro check + test:nenmong xanh; lint 0 FAIL; tổng 267; test
      thực thi 31 canonical + cặp corr≡CTE + unit so sánh đều qua.
- [ ] Lazy-load xác nhận (QA 7); ba nút chấm thuần tay người (QA 9).
- [ ] deck-sql.ts byte-identical bản giao; chỉ các file §1 + sqlgrader.ts +
      component Đối chiếu + test script được đụng.

## §10. Bốn dòng của kỳ tự nghiệm (sau khi deploy — của chủ kênh, không phải
của Claude Code)

Giả thuyết: sự trôi chảy Nền-SQL là nút thắt khi giải bài Database, không
phải tư duy tập hợp. Chỉ số: gate pass ngày 2+ tăng; thời gian viết khối
top-k giảm qua các lần gate. Ngân sách: 7 ngày × 15–20 phút, đóng băng tính
năng track SQL trong kỳ. Điều kiện dừng: khảo sát đầu vào toàn Đúng → track
này là cho người xem, không phải cho tôi — chuyển thẳng nó sang vai công cụ
đồng hành của kênh.
