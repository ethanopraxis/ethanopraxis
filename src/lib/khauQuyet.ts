/** Sáu khẩu quyết — Binh Pháp Nhu–Tỉnh, Quyển 12. Verbatim; do not rephrase. */
export const KHAU_QUYET = [
  'Nhu nhi bất đãi — Chờ mà không biếng',
  'Động nhi bất vọng — Làm mà không hấp tấp',
  'Tiến nhi bất tham — Tiến mà không tham thắng nhỏ',
  'Thối nhi bất bại — Lui mà không xem là thất bại',
  'Đào nhi bất tuyệt — Đào mà không bỏ giữa đường',
  'Tỉnh nhi lợi nhân — Có nguồn rồi phải làm lợi cho người',
] as const;

/** One line per build day — rotates without any client-side JS. */
export function khauQuyetOfTheDay(now = new Date()): string {
  const day = Math.floor(now.getTime() / 86_400_000);
  return KHAU_QUYET[day % KHAU_QUYET.length]!;
}
