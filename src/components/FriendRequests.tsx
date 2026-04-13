import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { get, onValue, ref, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { FriendRequest } from "@/types/diary";
import { Check, X, UserPlus, Inbox } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";

interface FriendRequestWithSender extends FriendRequest {
  senderUid: string;
}

export default function FriendRequests() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequestWithSender[]>([]);
  const [acceptingUid, setAcceptingUid] = useState<string | null>(null);
  const [rejectingUid, setRejectingUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const friendRequestsRef = ref(db, `friend_requests/${user.uid}`);
    const unsubscribe = onValue(friendRequestsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data || typeof data !== "object") {
        setFriendRequests([]);
        setLoading(false);
        return;
      }

      const requests = Object.entries(data)
        .filter(([_, value]: [string, any]) => value?.status === "pending")
        .map(([senderUid, value]: [string, any]) => ({
          id: senderUid,
          senderUid,
          fromUid: senderUid,
          fromName: value.senderName || t("dashboard.tab.myDiaries"),
          fromPublicKey: value.senderPublicKey,
          toUid: user.uid,
          status: "pending" as const,
          createdAt: value.createdAt || Date.now(),
        }));

      setFriendRequests(requests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, t]);

  const handleAcceptRequest = async (request: FriendRequestWithSender) => {
    if (!user) return;

    setAcceptingUid(request.senderUid);

    try {
      const myUserRef = ref(db, `users/${user.uid}`);
      const myUserSnapshot = await get(myUserRef);

      if (!myUserSnapshot.exists()) {
        throw new Error(t("friendRequests.error_account"));
      }

      const myPublicKey = myUserSnapshot.val().publicKey;
      if (!myPublicKey) {
        throw new Error(t("friendRequests.error_publickey"));
      }

      await update(ref(db), {
        [`contacts/${user.uid}/${request.senderUid}`]: {
          displayName: request.fromName,
          publicKey: request.fromPublicKey,
        },
        [`contacts/${request.senderUid}/${user.uid}`]: {
          displayName: user.displayName || t("dashboard.tab.myDiaries"),
          publicKey: myPublicKey,
        },
        [`friend_requests/${user.uid}/${request.senderUid}`]: null,
        [`friend_requests/${request.senderUid}/${user.uid}`]: null,
      });

      await createNotification({
        userUid: request.senderUid,
        type: "friend_accept",
        title: t("notifications.friend_accept_title"),
        message: t("notifications.friend_accept_message", {
          name: user.displayName || t("dashboard.tab.myDiaries"),
        }),
      });

      toast.success(t("friendRequests.accepted", { name: request.fromName }));
    } catch (err: any) {
      toast.error(err.message || t("friendRequests.error_accept"));
      console.error("Accept request error:", err);
    } finally {
      setAcceptingUid(null);
    }
  };

  const handleRejectRequest = async (request: FriendRequestWithSender) => {
    if (!user) return;

    setRejectingUid(request.senderUid);

    try {
      await update(ref(db), {
        [`friend_requests/${user.uid}/${request.senderUid}`]: null,
      });

      await createNotification({
        userUid: request.senderUid,
        type: "friend_reject",
        title: t("notifications.friend_reject_title"),
        message: t("notifications.friend_reject_message", {
          name: user.displayName || t("dashboard.tab.myDiaries"),
        }),
      });

      toast.success(t("friendRequests.rejected", { name: request.fromName }));
    } catch (err: any) {
      toast.error(err.message || t("friendRequests.error_reject"));
      console.error("Reject request error:", err);
    } finally {
      setRejectingUid(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t("friendRequests.title")}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-secondary/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Inbox className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">
          {t("friendRequests.title")} {friendRequests.length > 0 && `(${friendRequests.length})`}
        </h3>
      </div>

      {friendRequests.length === 0 ? (
        <div className="text-center py-8">
          <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{t("friendRequests.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {friendRequests.map((request) => (
            <div
              key={request.senderUid}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">{request.fromName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("friendRequests.sent_date", {
                    date: new Date(request.createdAt).toLocaleDateString("vi-VN"),
                  })}
                </p>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleAcceptRequest(request)}
                  disabled={acceptingUid === request.senderUid || rejectingUid === request.senderUid}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  title={t("friendRequests.accept_button")}
                >
                  <Check className="w-4 h-4" />
                  {acceptingUid === request.senderUid
                    ? t("friendRequests.accepting")
                    : t("friendRequests.accept_button")}
                </button>

                <button
                  onClick={() => handleRejectRequest(request)}
                  disabled={rejectingUid === request.senderUid || acceptingUid === request.senderUid}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-destructive/20 text-destructive text-sm font-medium hover:bg-destructive/30 disabled:opacity-50 transition-colors"
                  title={t("friendRequests.reject_button")}
                >
                  <X className="w-4 h-4" />
                  {rejectingUid === request.senderUid
                    ? t("friendRequests.rejecting")
                    : t("friendRequests.reject_button")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
