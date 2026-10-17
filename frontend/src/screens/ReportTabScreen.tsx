import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Calendar } from "../components/Calendar";
import type { TodayReport } from "../types";

type Props = {
  onError: (message: string) => void;
};

export function ReportTabScreen({ onError }: Props) {
  const [report, setReport] = useState<TodayReport | null>(null);

  useEffect(() => {
    api
      .getTodayReport()
      .then(setReport)
      .catch((e) => onError((e as Error).message));
  }, [onError]);

  return (
    <div className="screen">
      <h2>今日のレポート</h2>

      {report ? (
        <div className="card report-summary">
          {report.logs.length > 0 ? (
            <>
              <div className="report-stats">
                <div className="report-stat">
                  <span className="report-stat-value">
                    {Math.round(report.total_duration_sec / 60)}
                  </span>
                  <span className="report-stat-label">分</span>
                </div>
                <div className="report-stat">
                  <span className="report-stat-value">{report.total_calories}</span>
                  <span className="report-stat-label">kcal</span>
                </div>
                <div className="report-stat">
                  <span className="report-stat-value">{report.total_xp}</span>
                  <span className="report-stat-label">XP</span>
                </div>
              </div>
              <p className="sub">{report.logs.length}回の運動を完了</p>
            </>
          ) : (
            <p>今日はまだ運動していません</p>
          )}
        </div>
      ) : (
        <p>読み込み中...</p>
      )}

      <Calendar onError={onError} />
    </div>
  );
}
