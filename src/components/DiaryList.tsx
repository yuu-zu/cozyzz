import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { DiaryEntry, MOOD_CONFIG } from "@/types/diary";
import { forceRichTextStyles } from "@/lib/utils";
import { Edit3, Trash2, ChevronDown, ChevronUp, Image, Share2 } from "lucide-react";

interface Props {
  entries: DiaryEntry[];
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
  onShare: (entry: DiaryEntry) => void;
}

export default function DiaryList({ entries, onEdit, onDelete, onShare }: Props) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in">
        <p className="text-4xl mb-3">📖</p>
        <p className="text-muted-foreground">{t("diaryList.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const moodCfg = MOOD_CONFIG[entry.mood];
        const isExpanded = expanded === entry.id;
        return (
          <div
            key={entry.id}
            className="glass-card p-4 animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`mood-chip ${moodCfg.colorClass}`}>
                    {moodCfg.emoji} {t(`mood.${entry.mood}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString(
                      i18n.language === "vi" ? "vi-VN" : "en-US",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground truncate">{entry.title}</h3>

                {isExpanded ? (
                  <div
                    className="mt-2 text-sm break-words whitespace-pre-wrap overflow-auto rich-text-content"
                    style={{ maxHeight: "300px" }}
                    dangerouslySetInnerHTML={{ __html: forceRichTextStyles(entry.content) }}
                  />
                ) : (
                  <div
                    className="mt-1 text-sm text-muted-foreground line-clamp-2 break-words rich-text-content"
                    dangerouslySetInnerHTML={{ __html: forceRichTextStyles(entry.content) }}
                  />
                )}

                {entry.images?.length > 0 && isExpanded && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {entry.images.map((img, idx) => (
                      <img key={idx} src={img} alt="" className="w-24 h-24 rounded-xl object-cover" />
                    ))}
                  </div>
                )}
                {entry.images?.length > 0 && !isExpanded && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Image className="w-3 h-3" /> {entry.images.length} {t("diaryList.photos")}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => onShare(entry)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary"
                  title="Chia sẻ nhật ký này"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(entry)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
