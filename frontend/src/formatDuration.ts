// 秒数を「20秒」「3分」「1分30秒」の形にする (1種目だけのメニューなど、1分未満もあるため)
export function formatDuration(totalSec: number) {
  const sec = Math.round(totalSec);
  if (sec < 60) return `${sec}秒`;
  const min = Math.floor(sec / 60);
  const rest = sec % 60;
  return rest === 0 ? `${min}分` : `${min}分${rest}秒`;
}
