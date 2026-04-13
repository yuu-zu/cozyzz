import React, { useMemo, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { AppNotification } from "@/types/diary";
import { markAllNotificationsAsRead } from "@/lib/notifications";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const hasLoadedRef = useRef(false);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (!user?.uid) return;

    const notificationsRef = ref(db, `notifications/${user.uid}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      const nextNotifications: AppNotification[] = !data
        ? []
        : Object.entries(data)
            .map(([id, value]: [string, any]) => ({
              id,
              type: value.type,
              title: value.title,
              message: value.message,
              createdAt: value.createdAt || 0,
              isRead: Boolean(value.isRead),
            }))
            .sort((a, b) => b.createdAt - a.createdAt);

      if (!hasLoadedRef.current) {
        knownNotificationIdsRef.current = new Set(nextNotifications.map((item) => item.id));
        hasLoadedRef.current = true;
      } else {
        nextNotifications.forEach((notification) => {
          if (!knownNotificationIdsRef.current.has(notification.id) && !notification.isRead) {
            toast.info(notification.title, {
              description: notification.message,
            });
          }
        });

        knownNotificationIdsRef.current = new Set(nextNotifications.map((item) => item.id));
      }

      setNotifications(nextNotifications);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && user?.uid) {
      const unreadIds = notifications.filter((item) => !item.isRead).map((item) => item.id);
      await markAllNotificationsAsRead(user.uid, unreadIds);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          void handleToggle();
        }}
        className="relative p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-background shadow-2xl p-3 z-50">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-foreground">Thông báo</p>
            <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
              Đóng
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">Chưa có thông báo nào.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-xl border px-3 py-3 ${
                    notification.isRead ? "bg-secondary/20 border-border" : "bg-primary/5 border-primary/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                    {!notification.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-6">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notification.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
