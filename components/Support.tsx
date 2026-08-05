import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Gift, Loader2 } from "lucide-react";
import { useI18n } from "../i18n";
import { useTheme } from "../theme";

interface DonorEntry {
  name: string;
  amount: string;
  message: string;
  date: string;
  link: string;
}

function splitCsvRow(row: string) {
  const values: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];

    if (character === '"') {
      if (inQuotes && row[index + 1] === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue.trim());
  return values;
}

function parseDonorsCsv(csvText: string): DonorEntry[] {
  const rows = csvText
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter((row) => row.length > 0);

  if (rows.length < 2) {
    return [];
  }

  const headers = splitCsvRow(rows[0]).map((header) =>
    header.trim().toLowerCase(),
  );

  return rows
    .slice(1)
    .map((row) => {
      const values = splitCsvRow(row);
      const record = headers.reduce<Record<string, string>>(
        (accumulator, header, index) => {
          accumulator[header] = values[index] ?? "";
          return accumulator;
        },
        {},
      );

      return {
        name: record.name || record.nickname || "Anonymous",
        amount: record.amount || record.value || "",
        message: record.message || record.note || "",
        date: record.date || record.time || "",
        link: record.link || record.url || "",
      };
    })
    .filter((donor) => donor.name.length > 0);
}

const Support: React.FC = () => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const [donors, setDonors] = useState<DonorEntry[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [donorError, setDonorError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDonors() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}donors.csv`);

        if (!response.ok) {
          throw new Error(`Failed to load donors.csv: ${response.status}`);
        }

        const csvText = await response.text();
        const parsedDonors = parseDonorsCsv(csvText);

        if (!cancelled) {
          setDonors(parsedDonors);
          setDonorError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setDonors([]);
          setDonorError(
            error instanceof Error ? error.message : t.support.donorsError,
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingDonors(false);
        }
      }
    }

    loadDonors();

    return () => {
      cancelled = true;
    };
  }, [t.support.donorsError]);

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div>
          <h1
            className={`text-4xl lg:text-5xl font-bold mb-4 ${theme === "light" ? "text-stone-900" : "text-white"}`}
          >
            {t.support.pageTitle}
          </h1>
          <p
            className={`text-lg max-w-3xl ${theme === "light" ? "text-stone-600" : "text-zinc-400"}`}
          >
            {t.support.pageDesc}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div
            className={`relative rounded-2xl p-8 border overflow-hidden ${theme === "light" ? "bg-white border-stone-200" : "bg-zinc-900/50 border-zinc-800"}`}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(34,197,94,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(16,185,129,0.12), transparent 35%)",
              }}
            ></div>
            <div className="relative space-y-4">
              <h3
                className={`text-2xl font-bold ${theme === "light" ? "text-stone-900" : "text-white"}`}
              >
                {t.support.contributeTitle}
              </h3>
              <p
                className={`${theme === "light" ? "text-stone-600" : "text-zinc-400"} leading-relaxed`}
              >
                {t.support.contributeDesc}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://lamina.levimc.org/maintainer_guides/cpp_style_guide/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-lite-500 to-emerald-500 text-white font-semibold shadow-lg shadow-lite-500/25 hover:shadow-lite-500/40 hover:from-lite-600 hover:to-emerald-600 transition-all"
                >
                  {t.support.contributeCta}
                </a>
                <a
                  href="https://github.com/LiteLDev"
                  target="_blank"
                  rel="noreferrer"
                  className={`px-5 py-2.5 rounded-lg border font-medium transition-all ${theme === "light" ? "bg-white border-stone-200 hover:border-stone-300 text-stone-900" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-white"}`}
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>

          <div
            className={`relative rounded-2xl p-8 border overflow-hidden ${theme === "light" ? "bg-stone-50 border-stone-200" : "bg-zinc-900/40 border-zinc-800"}`}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 15% 30%, rgba(52,211,153,0.18), transparent 35%), radial-gradient(circle at 85% 10%, rgba(59,130,246,0.14), transparent 30%)",
              }}
            ></div>
            <div className="relative space-y-4">
              <h3
                className={`text-2xl font-bold ${theme === "light" ? "text-stone-900" : "text-white"}`}
              >
                {t.support.donateTitle}
              </h3>
              <p
                className={`${theme === "light" ? "text-stone-600" : "text-zinc-400"} leading-relaxed`}
              >
                {t.support.donateDesc}
              </p>

              <div className="space-y-3">
                <div
                  className={`text-sm font-semibold uppercase tracking-wide ${theme === "light" ? "text-stone-500" : "text-zinc-500"}`}
                >
                  {t.support.donateChannels}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <a
                    href="https://afdian.com/a/liteldev"
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${theme === "light" ? "bg-white border-stone-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100" : "bg-zinc-900 border-zinc-700 hover:border-emerald-400/70 hover:shadow-emerald-500/10"}`}
                  >
                    <span
                      className={`font-semibold ${theme === "light" ? "text-stone-900" : "text-white"}`}
                    >
                      {t.support.channelAfdian}
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`}
                    />
                  </a>
                  <a
                    href="https://opencollective.com/levimc"
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all min-w-[180px] ${theme === "light" ? "bg-white border-stone-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100" : "bg-zinc-900 border-zinc-700 hover:border-indigo-400/70 hover:shadow-indigo-500/10"}`}
                  >
                    <span
                      className={`font-semibold ${theme === "light" ? "text-stone-900" : "text-white"}`}
                    >
                      {t.support.channelOpenCollective}
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 ${theme === "light" ? "text-indigo-600" : "text-indigo-400"}`}
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2
                className={`text-2xl lg:text-3xl font-bold ${theme === "light" ? "text-stone-900" : "text-white"}`}
              >
                {t.support.donorsSectionTitle}
              </h2>
            </div>
            <p
              className={`max-w-2xl text-sm lg:text-base ${theme === "light" ? "text-stone-600" : "text-zinc-400"}`}
            >
              {t.support.donorsSectionDesc}
            </p>
          </div>

          {loadingDonors ? (
            <div
              className={`rounded-2xl border p-10 text-center ${theme === "light" ? "bg-white border-stone-200" : "bg-zinc-900/50 border-zinc-800"}`}
            >
              <Loader2
                className={`w-6 h-6 mx-auto mb-3 animate-spin ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`}
              />
              <p
                className={
                  theme === "light" ? "text-stone-600" : "text-zinc-400"
                }
              >
                {t.support.donorsLoading}
              </p>
            </div>
          ) : donorError ? (
            <div
              className={`rounded-2xl border p-6 flex items-start gap-3 ${theme === "light" ? "bg-white border-stone-200 text-stone-700" : "bg-zinc-900/50 border-zinc-800 text-zinc-300"}`}
            >
              <AlertCircle className="w-5 h-5 mt-0.5 text-rose-500" />
              <div>
                <div className="font-semibold mb-1">
                  {t.support.donorsErrorTitle}
                </div>
                <p className="text-sm opacity-80">{donorError}</p>
              </div>
            </div>
          ) : donors.length === 0 ? (
            <div
              className={`rounded-2xl border p-10 text-center ${theme === "light" ? "bg-white border-stone-200" : "bg-zinc-900/50 border-zinc-800"}`}
            >
              <p
                className={`text-lg font-semibold mb-2 ${theme === "light" ? "text-stone-900" : "text-white"}`}
              >
                {t.support.donorsEmptyTitle}
              </p>
              <p
                className={
                  theme === "light" ? "text-stone-600" : "text-zinc-400"
                }
              >
                {t.support.donorsEmpty}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {donors.map((donor, index) => (
                <article
                  key={`${donor.name}-${donor.date}-${index}`}
                  className={`group relative rounded-2xl p-5 border transition-all hover:-translate-y-1 ${theme === "light" ? "bg-white border-stone-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100" : "bg-zinc-900/50 border-zinc-800 hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/10"}`}
                >
                  <div
                    className="absolute inset-0 pointer-events-none opacity-60"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 20%, rgba(52,211,153,0.12), transparent 35%)",
                    }}
                  ></div>
                  <div className="relative space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3
                          className={`text-lg font-bold ${theme === "light" ? "text-stone-900" : "text-white"}`}
                        >
                          {donor.name}
                        </h3>
                        {donor.date && (
                          <p
                            className={`text-sm mt-1 ${theme === "light" ? "text-stone-500" : "text-zinc-500"}`}
                          >
                            {donor.date}
                          </p>
                        )}
                      </div>
                      {donor.amount && (
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${theme === "light" ? "bg-emerald-50 text-emerald-700" : "bg-emerald-500/10 text-emerald-300"}`}
                        >
                          {donor.amount}
                        </span>
                      )}
                    </div>

                    {donor.message && (
                      <p
                        className={`${theme === "light" ? "text-stone-600" : "text-zinc-400"} leading-relaxed`}
                      >
                        {donor.message}
                      </p>
                    )}

                    {donor.link && (
                      <a
                        href={donor.link}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${theme === "light" ? "text-emerald-700 hover:text-emerald-800" : "text-emerald-400 hover:text-emerald-300"}`}
                      >
                        {t.support.donorLinkLabel}
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Support;
