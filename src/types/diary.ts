export type Mood = "happy" | "sad" | "angry" | "calm" | "excited" | "neutral";

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  images: string[];
  createdAt: number;
  updatedAt: number;
  isTrashed?: boolean;
  trashedAt?: number;
  deletedAt?: number; // timestamp when moved to trash (legacy)
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromPublicKey: string;
  toUid: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
}

export interface Friend {
  uid: string;
  displayName: string;
  publicKey: string;
}

export interface SharedDiary {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  encryptedContent: string;
  encryptedTitle: string;
  createdAt: number;
  isRead: boolean;
  isDecrypted?: boolean;
}

export interface AppNotification {
  id: string;
  type: "friend_request" | "friend_accept" | "friend_reject" | "diary_shared";
  title: string;
  message: string;
  createdAt: number;
  isRead: boolean;
}

export interface UserProfile {
  displayName: string;
  email: string;
  publicKey: string;
  photoURL?: string;
  createdAt: number;
}

export const MOOD_CONFIG: Record<Mood, { emoji: string; label: string; colorClass: string }> = {
  happy: { emoji: "😊", label: "Vui vẻ", colorClass: "bg-mood-happy/20 text-mood-happy" },
  sad: { emoji: "😢", label: "Buồn", colorClass: "bg-mood-sad/20 text-mood-sad" },
  angry: { emoji: "😠", label: "Tức giận", colorClass: "bg-mood-angry/20 text-mood-angry" },
  calm: { emoji: "😌", label: "Bình yên", colorClass: "bg-mood-calm/20 text-mood-calm" },
  excited: { emoji: "🤩", label: "Phấn khích", colorClass: "bg-mood-excited/20 text-mood-excited" },
  neutral: { emoji: "😐", label: "Bình thường", colorClass: "bg-mood-neutral/20 text-mood-neutral" },
};

export const JOURNAL_PROMPTS = [
  "Hôm nay điều gì làm bạn mỉm cười?",
  "Bạn biết ơn điều gì hôm nay?",
  "Mô tả một khoảnh khắc đáng nhớ trong ngày",
  "Bạn đã học được gì mới hôm nay?",
  "Nếu có thể thay đổi một điều hôm nay, đó là gì?",
  "Bạn muốn ngày mai sẽ như thế nào?",
  "Ai đã mang lại niềm vui cho bạn hôm nay?",
  "Bạn cảm thấy tự hào về điều gì?",
  "Điều gì khiến bạn lo lắng và bạn có thể làm gì?",
  "Viết một lá thư cho bản thân tương lai",
];
