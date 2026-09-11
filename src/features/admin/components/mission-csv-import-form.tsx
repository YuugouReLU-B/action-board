"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { importMissionCsv } from "@/features/admin/actions/mission-csv-import-actions";
import type { MissionCsvImportResult } from "@/features/admin/services/mission-csv-import";

export function MissionCsvImportForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<MissionCsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const response = await importMissionCsv(formData);
      if (!response.success) {
        setError(response.error);
        return;
      }
      setResult(response.result);
      formRef.current?.reset();
    });
  }

  return (
    <div className="space-y-4">
      <form ref={formRef} action={handleSubmit} className="space-y-3">
        <input
          type="file"
          name="csv_file"
          accept=".csv,text/csv"
          required
          className="block w-full text-sm"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "取り込み中..." : "CSVを取り込む"}
        </Button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="space-y-2 rounded-lg border p-4">
          <p className="text-sm font-bold">
            成功 {result.succeeded.length} 件 / 失敗 {result.failed.length} 件
          </p>
          {result.failed.length > 0 && (
            <ul className="space-y-1 text-sm text-red-600">
              {result.failed.map((f) => (
                <li key={f.rowNumber}>
                  {f.rowNumber}行目: {f.errors.join(" / ")}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
