/* Nền Móng — shared content types (language-agnostic) */

export type Grade = "dung" | "lech" | "sai";
export type Lv = 0 | 1 | 2 | 3 | 4 | 5;

export interface Drill {
  /** unique within its deck */
  id: string;
  lv: Lv;
  /** tên khối */
  t: string;
  /** đề bài */
  p: string;
  /** code kèm đề (tuỳ chọn) */
  pc?: string;
  /** đáp án idiomatic */
  a: string;
  /** ghi chú / bẫy (tuỳ chọn) */
  n?: string;
  /** biến thể đề, xoay theo số lượt (tuỳ chọn) */
  v?: string[];
  /** khối SQL chạy được: grader dựng DB in-memory từ SETUPS[setup], chạy cả hai
   *  query và so multiset dòng (so THỨ TỰ khi ordered=true). Vắng mặt = tự chấm thuần. */
  sql?: { setup: string; ordered?: boolean };
}
