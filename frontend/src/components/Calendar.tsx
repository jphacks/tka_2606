import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { CalendarDay } from "../types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// "2026-10-17" の形式 (端末の時刻 = 日本時間を想定)
function toDateString(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type Props = {
  onError: (message: string) => void;
};

// 月ごとのカレンダー。運動した日に印をつける
export function Calendar({ onError }: Props) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const today = toDateString(thisYear, thisMonth, now.getDate());

  const [{ year, month }, setYearMonth] = useState({ year: thisYear, month: thisMonth });
  const [days, setDays] = useState<Map<string, CalendarDay>>(new Map());

  useEffect(() => {
    let ignore = false; // 月を素早く切り替えたとき、古い結果で上書きしない
    api
      .getCalendar(`${year}-${String(month).padStart(2, "0")}`)
      .then((res) => {
        if (!ignore) setDays(new Map(res.days.map((d) => [d.date, d])));
      })
      .catch((e) => onError((e as Error).message));
    return () => {
      ignore = true;
    };
  }, [year, month, onError]);

  const moveMonth = (diff: number) => {
    const date = new Date(year, month - 1 + diff, 1);
    setYearMonth({ year: date.getFullYear(), month: date.getMonth() + 1 });
  };
  const isThisMonth = year === thisYear && month === thisMonth;

  // 1日の曜日の分だけ空白を入れてから、日付を並べる
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="card calendar">
      <div className="calendar-header">
        <button onClick={() => moveMonth(-1)} aria-label="前の月">
          ‹
        </button>
        <span>
          {year}年{month}月
        </span>
        {/* 未来の月には記録がないので進めない */}
        <button onClick={() => moveMonth(1)} disabled={isThisMonth} aria-label="次の月">
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((w) => (
          <span key={w} className="calendar-weekday">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} />;
          const date = toDateString(year, month, day);
          const record = days.get(date);
          const className = [
            "calendar-day",
            record ? "done" : "",
            date === today ? "today" : "",
          ].join(" ");
          return (
            <span
              key={date}
              className={className}
              title={
                record
                  ? `${Math.round(record.total_duration_sec / 60)}分 / ${record.total_calories}kcal`
                  : undefined
              }
            >
              {day}
            </span>
          );
        })}
      </div>

      <p className="sub">今月は {days.size}日 運動しました</p>
    </div>
  );
}
