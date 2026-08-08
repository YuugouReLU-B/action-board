"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HEADER_HEIGHT } from "@/lib/constants/layout";
import { getAllEvents } from "../loaders/posting-events-loaders";
import type { PostingEvent } from "../services/posting-events";

interface PostingControlPanelProps {
  eventId: string;
  eventTitle: string;
  isEventActive: boolean;
  totalPostingCount?: number;
  showOnlyMine: boolean;
  onShowOnlyMineChange: (value: boolean) => void;
}

export function PostingControlPanel({
  eventId,
  eventTitle,
  isEventActive,
  totalPostingCount,
  showOnlyMine,
  onShowOnlyMineChange,
}: PostingControlPanelProps) {
  const router = useRouter();
  const [events, setEvents] = useState<PostingEvent[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // イベント一覧を取得
  useEffect(() => {
    getAllEvents().then(setEvents).catch(console.error);
  }, []);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEventSelect = (slug: string) => {
    setIsDropdownOpen(false);
    router.push(`/map/posting/${slug}`);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: `${HEADER_HEIGHT + 16}px`,
        right: "10px",
        zIndex: 45,
        background: "white",
        padding: "10px",
        borderRadius: "5px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: "var(--app-panel-text)",
            background: "none",
            border: "none",
            cursor: events.length > 1 ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: 0,
          }}
        >
          {eventTitle}
          {!isEventActive && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--app-panel-text-muted)",
                fontWeight: "normal",
              }}
            >
              (終了)
            </span>
          )}
          {events.length > 1 && (
            <ChevronDown
              size={16}
              style={{
                transform: isDropdownOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          )}
        </button>
        {isDropdownOpen && events.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "4px",
              background: "white",
              borderRadius: "5px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              minWidth: "250px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                fontSize: "11px",
                color: "var(--app-panel-text-muted)",
                borderBottom: "1px solid var(--app-panel-divider)",
              }}
            >
              表示するポスティングイベントを切り替える
            </div>
            {events.map((event) => {
              const isCurrent = event.id === eventId;
              return (
                <button
                  key={event.id}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => !isCurrent && handleEventSelect(event.slug)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "13px",
                    textAlign: "left",
                    background: isCurrent
                      ? "var(--app-panel-hover-bg)"
                      : "none",
                    border: "none",
                    cursor: isCurrent ? "default" : "pointer",
                    color: isCurrent
                      ? "var(--app-panel-text-disabled)"
                      : "var(--app-panel-text)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.background =
                        "var(--app-panel-hover-bg)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.background = "none";
                    }
                  }}
                >
                  {event.title}
                  {!event.is_active && (
                    <span
                      style={{
                        marginLeft: "4px",
                        fontSize: "11px",
                        color: "var(--app-panel-text-disabled)",
                      }}
                    >
                      (終了)
                    </span>
                  )}
                  {isCurrent && (
                    <span style={{ marginLeft: "8px", fontSize: "11px" }}>
                      (現在表示中)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {totalPostingCount !== undefined && (
        <div
          style={{
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>現在の配布枚数</span>
          <span
            style={{
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {totalPostingCount.toLocaleString()}枚
          </span>
        </div>
      )}
      <label
        style={{
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          cursor: "pointer",
          color: showOnlyMine
            ? "var(--app-panel-active)"
            : "var(--app-panel-text-muted)",
          fontWeight: showOnlyMine ? "bold" : "normal",
        }}
      >
        <input
          type="checkbox"
          checked={showOnlyMine}
          onChange={(e) => onShowOnlyMineChange(e.target.checked)}
          style={{ cursor: "pointer" }}
        />
        自分のエリアのみ表示
      </label>
    </div>
  );
}
