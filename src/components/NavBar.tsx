import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { Shield, LogOut, Moon, Sun, Download, Settings, Globe } from "lucide-react";
import { useLocation } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import NotificationBell from "@/components/NotificationBell";

interface Props {
  onOpenSettings?: () => void;
}

export default function NavBar({ onOpenSettings }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isVietnamese = i18n.language === "vi";
  const logoStyle = {
    filter:
      "drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff)",
  };

  const toggleLanguage = () => {
    const newLang = isVietnamese ? "en" : "vi";
    i18n.changeLanguage(newLang);
    localStorage.setItem("i18nextLng", newLang);
  };

  const handleBackup = async () => {
    if (!user) return;
    const snapshot = await get(ref(db, `diaries/${user.uid}`));
    const data = snapshot.val() || {};
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cozy-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 glass-nav">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {location.pathname === "/" ? (
            <img
              src="/logo-hub.webp"
              alt="Hub Logo"
              className="h-8 w-auto object-contain"
              style={logoStyle}
            />
          ) : (
            <Shield className="w-5 h-5 text-primary" />
          )}
          <span className="font-bold tracking-wider text-foreground">COZY</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground hidden sm:block mr-2">
            {user?.displayName}
          </span>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            title={theme === "light" ? "Dark mode" : "Light mode"}
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleLanguage}
            className="border border-gray-300 rounded-full px-3 py-1 flex items-center gap-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 transition-all"
            title={isVietnamese ? t("header.switchToEnglish") : t("header.switchToVietnamese")}
          >
            <Globe className="w-4 h-4" />
            <span>{isVietnamese ? "EN" : "VN"}</span>
          </button>
          <NotificationBell />
          <button
            onClick={handleBackup}
            className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            title={isVietnamese ? "Sao lưu dữ liệu" : "Back up data"}
          >
            <Download className="w-4 h-4" />
          </button>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              title={t("settings.title")}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={logout}
            className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title={isVietnamese ? "Đăng xuất" : "Log out"}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
