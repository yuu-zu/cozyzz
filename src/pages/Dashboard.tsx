import React, { useState, useEffect, useCallback } from "react";
import { ref, push, set, onValue, remove, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { DiaryEntry, Mood, MOOD_CONFIG, JOURNAL_PROMPTS } from "@/types/diary";
import DiaryEditor from "@/components/DiaryEditor";
import DiaryList from "@/components/DiaryList";
import DiaryCalendar from "@/components/DiaryCalendar";
import MoodStats from "@/components/MoodStats";
import FriendsPanel from "@/components/FriendsPanel";
import SendDiary from "@/components/SendDiary";
import TrashBin from "@/components/TrashBin";
import NavBar from "@/components/NavBar";
import SettingsPanel from "@/components/SettingsPanel";
import FriendRequests from "@/components/FriendRequests";
import MyDiaries from "@/components/MyDiaries";
import { Plus, Search, Calendar, BarChart3, Users, Mail, BookOpen, Trash2 } from "lucide-react";

type Tab = "list" | "calendar" | "stats" | "friends" | "shared" | "my-diaries" | "trash";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [allEntries, setAllEntries] = useState<DiaryEntry[]>([]);
  const [tab, setTab] = useState<Tab>("list");
  const [showEditor, setShowEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editEntry, setEditEntry] = useState<DiaryEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState<Mood | "all">("all");
  const [filterDate, setFilterDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");

  // Lắng nghe Custom Event để chuyển tab
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const newTab = event.detail;
      if (newTab === 'shared') {
        setTab("shared");
      }
    };

    window.addEventListener('change_main_tab', handleTabChange as EventListener);
    
    return () => {
      window.removeEventListener('change_main_tab', handleTabChange as EventListener);
    };
  }, []);

  // Load entries
  useEffect(() => {
    if (!user) return;
    const entriesRef = ref(db, `diaries/${user.uid}`);
    const unsub = onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val,
        })) as DiaryEntry[];
        setAllEntries(list);
      } else {
        setAllEntries([]);
      }
    });
    return () => unsub();
  }, [user]);

  // Auto-delete expired trash items
  useEffect(() => {
    if (!user) return;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    allEntries
      .filter((e) => e.trashedAt && e.trashedAt < thirtyDaysAgo)
      .forEach((e) => {
        remove(ref(db, `diaries/${user.uid}/${e.id}`));
      });
  }, [allEntries, user]);

  // Active entries (not in trash)
  const activeEntries = allEntries.filter((e) => !e.isTrashed);
  const trashEntries = allEntries.filter((e) => !!e.isTrashed);

  // Daily reminder
  useEffect(() => {
    const lastReminder = localStorage.getItem("diary-last-reminder");
    const today = new Date().toDateString();
    if (lastReminder !== today) {
      const todayEntries = activeEntries.filter(
        (e) => new Date(e.createdAt).toDateString() === today
      );
      if (todayEntries.length === 0 && activeEntries.length > 0) {
        setShowPrompt(true);
        setCurrentPrompt(JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]);
        localStorage.setItem("diary-last-reminder", today);
      }
    }
  }, [activeEntries]);

  const saveEntry = useCallback(
    async (entry: Omit<DiaryEntry, "id">) => {
      if (!user) return;
      if (editEntry) {
        await update(ref(db, `diaries/${user.uid}/${editEntry.id}`), {
          ...entry,
          updatedAt: Date.now(),
        });
      } else {
        const newRef = push(ref(db, `diaries/${user.uid}`));
        await set(newRef, entry);
      }
      setShowEditor(false);
      setEditEntry(null);
    },
    [user, editEntry]
  );

  const moveToTrash = useCallback(
    async (id: string) => {
      if (!user) return;
      await update(ref(db, `diaries/${user.uid}/${id}`), { 
        isTrashed: true,
        trashedAt: Date.now()
      });
    },
    [user]
  );

  const restoreFromTrash = useCallback(
    async (id: string) => {
      if (!user) return;
      await update(ref(db, `diaries/${user.uid}/${id}`), { 
        isTrashed: false,
        trashedAt: null
      });
    },
    [user]
  );

  const permanentDelete = useCallback(
    async (id: string) => {
      if (!user) return;
      await remove(ref(db, `diaries/${user.uid}/${id}`));
    },
    [user]
  );

  // Filter & sort
  const filteredEntries = activeEntries
    .filter((e) => {
      if (filterMood !== "all" && e.mood !== filterMood) return false;
      if (filterDate) {
        const entryDate = new Date(e.createdAt).toISOString().split("T")[0];
        if (entryDate !== filterDate) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const plainContent = e.content.replace(/<[^>]*>/g, '').toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          plainContent.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) =>
      sortOrder === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );

  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: "list", icon: <Search className="w-4 h-4" />, label: t("dashboard.tab.journal") },
    { key: "calendar", icon: <Calendar className="w-4 h-4" />, label: t("dashboard.tab.calendar") },
    { key: "stats", icon: <BarChart3 className="w-4 h-4" />, label: t("dashboard.tab.stats") },
    { key: "friends", icon: <Users className="w-4 h-4" />, label: t("dashboard.tab.friends") },
    { key: "shared", icon: <Mail className="w-4 h-4" />, label: t("dashboard.tab.shared") },
    { key: "my-diaries", icon: <BookOpen className="w-4 h-4" />, label: t("dashboard.tab.myDiaries") },
    { key: "trash", icon: <Trash2 className="w-4 h-4" />, label: `${t("dashboard.tab.trash")} (${trashEntries.length})` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavBar onOpenSettings={() => setShowSettings(true)} />

      {/* Daily prompt */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
          <div className="glass-card p-6 max-w-sm w-full animate-scale-in text-center">
            <p className="text-lg font-semibold text-foreground mb-2">📝 {t("dashboard.promptTitle")}</p>
            <p className="text-muted-foreground mb-4">{currentPrompt}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => { setShowPrompt(false); setShowEditor(true); }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                {t("dashboard.promptWrite")}
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium"
              >
                {t("dashboard.promptLater")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 pt-20 pb-24">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === "list" && (
          <>
            {/* Filters */}
            <div className="glass-card p-4 mb-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t("dashboard.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/50 border border-border text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:border-primary outline-none"
                />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                  className="px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:border-primary outline-none"
                >
                  <option value="newest">{t("dashboard.sort.newest")}</option>
                  <option value="oldest">{t("dashboard.sort.oldest")}</option>
                </select>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterMood("all")}
                  className={`mood-chip transition-all ${
                    filterMood === "all" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {t("dashboard.filter.all")}
                </button>
                {(Object.keys(MOOD_CONFIG) as Mood[]).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setFilterMood(mood)}
                    className={`mood-chip transition-all ${
                      filterMood === mood ? MOOD_CONFIG[mood].colorClass : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {MOOD_CONFIG[mood].emoji} {t(`mood.${mood}`)}
                  </button>
                ))}
              </div>
            </div>

            <DiaryList
              entries={filteredEntries}
              onEdit={(e) => { setEditEntry(e); setShowEditor(true); }}
              onDelete={moveToTrash}
              onShare={(entry) => {
                localStorage.setItem(
                  "cozy_share_target",
                  JSON.stringify({
                    diaryId: entry.id,
                  }),
                );
                window.dispatchEvent(new Event("trigger_share_diary"));
                setTab("shared");
              }}
            />
          </>
        )}

        {tab === "calendar" && <DiaryCalendar entries={activeEntries} />}
        {tab === "stats" && <MoodStats entries={activeEntries} />}
        {tab === "friends" && (
          <div className="space-y-4">
            <FriendRequests />
            <FriendsPanel entries={activeEntries} />
          </div>
        )}
        {tab === "shared" && (
          <div className="space-y-4">
            <SendDiary entries={activeEntries} />
          </div>
        )}
        {tab === "my-diaries" && <MyDiaries />}
        {tab === "trash" && <TrashBin />}
      </div>

      {/* FAB */}
      {!showEditor && !showSettings && (
        <button
          onClick={() => { setEditEntry(null); setShowEditor(true); }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Editor modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
          <DiaryEditor
            entry={editEntry}
            onSave={saveEntry}
            onClose={() => { setShowEditor(false); setEditEntry(null); }}
          />
        </div>
      )}

      {/* Settings modal */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
