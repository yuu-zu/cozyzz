import { push, ref, set, update } from "firebase/database";
import { db } from "@/lib/firebase";

interface CreateNotificationParams {
  userUid: string;
  type: "friend_request" | "friend_accept" | "friend_reject" | "diary_shared";
  title: string;
  message: string;
}

export async function createNotification({
  userUid,
  type,
  title,
  message,
}: CreateNotificationParams) {
  const notificationRef = push(ref(db, `notifications/${userUid}`));

  await set(notificationRef, {
    type,
    title,
    message,
    createdAt: Date.now(),
    isRead: false,
  });
}

export async function markAllNotificationsAsRead(userUid: string, notificationIds: string[]) {
  const updates = Object.fromEntries(
    notificationIds.map((id) => [`notifications/${userUid}/${id}/isRead`, true]),
  );

  if (Object.keys(updates).length === 0) return;
  await update(ref(db), updates);
}
