export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  location: string | null;
  website: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  status: string;
  privacy: string;
  createdAt: string;
  _count?: {
    followers: number;
    following: number;
    posts: number;
  };
}

export interface Post {
  id: string;
  content: string | null;
  isEdited: boolean;
  viewCount: number;
  shareCount: number;
  author: UserPreview;
  media: Media[];
  hashtags: PostHashtag[];
  polls: Poll[];
  reactions: Reaction[];
  _count: {
    comments: number;
    reactions: number;
    bookmarks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserPreview {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio?: string | null;
}

export interface Comment {
  id: string;
  content: string;
  isEdited: boolean;
  author: UserPreview;
  parentId: string | null;
  replies: Comment[];
  _count: { replies: number };
  createdAt: string;
}

export interface Media {
  id: string;
  url: string;
  thumbnail: string | null;
  type: string;
  width: number | null;
  height: number | null;
  size: number | null;
  duration: number | null;
  alt: string | null;
}

export interface Reaction {
  type: string;
  count: number;
}

export interface Hashtag {
  id: string;
  name: string;
  count: number;
}

export interface PostHashtag {
  hashtag: Hashtag;
}

export interface Poll {
  id: string;
  question: string;
  expiresAt: string | null;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  text: string;
  count: number;
}

export interface Conversation {
  user: UserPreview;
  lastMessage: {
    content: string | null;
    type: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  content: string | null;
  type: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  duration: number | null;
  isRead: boolean;
  readAt: string | null;
  senderId: string;
  receiverId: string;
  sender: UserPreview;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  link: string | null;
  image: string | null;
  actor: UserPreview | null;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  visibility: string;
  inviteOnly: boolean;
  owner: UserPreview;
  members: GroupMember[];
  _count: { members: number; messages: number };
  createdAt: string;
}

export interface GroupMember {
  id: string;
  role: string;
  user: UserPreview;
  joinedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}
