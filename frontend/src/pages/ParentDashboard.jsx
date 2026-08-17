import React from "react";
import { useTranslation } from "react-i18next";
import { getProfile, getProgress, getLevel, getMasteredSkills, getWeakestSkills } from "../storage.js";

function humanizeSkill(skill) {
  return skill
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatReportDate(locale) {
  try {
    return new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return new Date().toLocaleDateString();
  }
}

export default function ParentDashboard() {
  const { t, i18n } = useTranslation();
  const profile = getProfile();
  const progress = getProgress(profile?.name);

  const mastered = profile?.name ? getMasteredSkills(profile.name) : [];
  const weakest = profile?.name ? getWeakestSkills(profile.name, 5) : [];

  const skillEntries = Object.values(progress.skills || {});
  const totalAttempts = skillEntries.reduce((sum, s) => sum + s.attempts, 0);
  const totalCorrect = skillEntries.reduce((sum, s) => sum + s.correct, 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;

  const recentHistory = (progress.history || []).slice(-8).reverse();

  const hasData = totalAttempts > 0;

  return (
    <div className="page parent-page">
      <h1>{t("modules.parentsTitle")}</h1>

      {!profile ? (
        <p className="parent-empty">{t("modules.parentsEmpty")}</p>
      ) : (
        <>
          <div className="parent-header-card">
            <div className="parent-avatar">{profile.avatar || "🙂"}</div>
            <div>
              <div className="parent-name">
                {profile.name}
                {profile.age ? ` · ${profile.age}` : ""}
              </div>
              <div className="parent-stats-row">
                <span>{t("modules.parentsLevel", { defaultValue: "Nível" })} {getLevel(progress.xp)}</span>
                <span>{progress.xp || 0} XP</span>
                <span>🔥 {progress.streak || 0}</span>
              </div>
            </div>
          </div>

          {!hasData ? (
            <p className="parent-empty">{t("modules.parentsEmpty")}</p>
          ) : (
            <>
              <div className="parent-actions no-print">
                <button type="button" className="parent-export-btn" onClick={() => window.print()}>
                  🖨️ {t("modules.parentsExportPdf")}
                </button>
              </div>

              <p className="parent-report-date print-only">
                {t("modules.parentsReportGenerated", { defaultValue: "Relatório gerado em" })} {formatReportDate(i18n.language)}
              </p>

              <section className="parent-section">
                <h2>{t("modules.parentsSummary")}</h2>
                <div className="parent-summary-grid">
                  <div className="parent-summary-tile">
                    <div className="parent-summary-value">{totalAttempts}</div>
                    <div className="parent-summary-label">{t("modules.parentsAttempts")}</div>
                  </div>
                  <div className="parent-summary-tile">
                    <div className="parent-summary-value">{overallAccuracy}%</div>
                    <div className="parent-summary-label">{t("modules.parentsAccuracy")}</div>
                    <div className="parent-bar-track">
                      <div className="parent-bar-fill" style={{ width: `${overallAccuracy}%` }} />
                    </div>
                  </div>
                </div>
              </section>

              <section className="parent-section">
                <h2>{t("modules.parentsMastered")}</h2>
                {mastered.length === 0 ? (
                  <p className="parent-muted">{t("modules.parentsEmpty")}</p>
                ) : (
                  <ul className="parent-list">
                    {mastered.map((skill) => (
                      <li key={skill} className="parent-list-item parent-list-item-good">
                        ✅ {humanizeSkill(skill)}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="parent-section">
                <h2>{t("modules.parentsNeedsPractice")}</h2>
                {weakest.length === 0 ? (
                  <p className="parent-muted">{t("modules.parentsEmpty")}</p>
                ) : (
                  <ul className="parent-list">
                    {weakest.map((row) => (
                      <li key={row.skill} className="parent-list-item">
                        <span>{humanizeSkill(row.skill)}</span>
                        <span className="parent-list-meta">
                          {Math.round(row.accuracy * 100)}% · {row.attempts}{" "}
                          {t("modules.parentsAttempts")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {recentHistory.length > 0 && (
                <section className="parent-section">
                  <h2>{t("modules.parentsRecent", { defaultValue: "Atividade recente" })}</h2>
                  <ul className="parent-list parent-history-list">
                    {recentHistory.map((h, i) => (
                      <li key={i} className="parent-list-item">
                        <span>{h.date} · {humanizeSkill(h.skill)}</span>
                        <span>{h.correct ? "✅" : "🔁"}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
