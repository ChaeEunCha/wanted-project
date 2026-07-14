"use client";

import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { PortfolioEntry, PortfolioType } from "@/lib/types";

interface PortfolioFieldProps {
  value: PortfolioEntry[];
  onChange: (entries: PortfolioEntry[]) => void;
  error?: string | null;
}

function createEmptyEntry(type: PortfolioType): PortfolioEntry {
  return { id: crypto.randomUUID(), type };
}

/**
 * PRD 5-2 AC: 포트폴리오는 URL 또는 파일 업로드 중 최소 1개 이상 등록.
 * TODO(백엔드 연동): 파일 저장소(S3 등)가 미정 상태라 실제 업로드는 구현하지 않고
 * 파일명만 클라이언트에 보관한다. 연동 시 여기서 실제 업로드 API를 호출하고
 * 응답으로 받은 file_key를 저장하도록 교체해야 한다.
 */
export function PortfolioField({ value, onChange, error }: PortfolioFieldProps) {
  const fileInputId = useId();

  function updateEntry(id: string, patch: Partial<PortfolioEntry>) {
    onChange(value.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function removeEntry(id: string) {
    onChange(value.filter((entry) => entry.id !== id));
  }

  function addEntry(type: PortfolioType) {
    onChange([...value, createEmptyEntry(type)]);
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        포트폴리오 (URL 또는 파일, 최소 1개)
      </span>

      <div className="flex flex-col gap-3">
        {value.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
          >
            <div className="flex-1">
              {entry.type === "url" ? (
                <Input
                  type="url"
                  placeholder="https://portfolio.example.com"
                  value={entry.url ?? ""}
                  onChange={(e) => updateEntry(entry.id, { url: e.target.value })}
                />
              ) : (
                <div>
                  <label htmlFor={`${fileInputId}-${entry.id}`}>
                    <input
                      id={`${fileInputId}-${entry.id}`}
                      type="file"
                      className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200 dark:text-zinc-300 dark:file:bg-zinc-800"
                      onChange={(e) =>
                        updateEntry(entry.id, {
                          fileName: e.target.files?.[0]?.name,
                        })
                      }
                    />
                  </label>
                  {entry.fileName && (
                    <p className="mt-1 text-xs text-zinc-500">
                      선택됨: {entry.fileName} (v1: 실제 업로드 없이 파일명만 저장)
                    </p>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeEntry(entry.id)}
              className="mt-2 text-xs font-medium text-zinc-400 hover:text-red-500"
              aria-label="포트폴리오 항목 삭제"
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => addEntry("url")}>
          + URL 추가
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => addEntry("file")}>
          + 파일 추가
        </Button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
