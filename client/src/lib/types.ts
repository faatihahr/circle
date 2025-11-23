export interface Thread {
  id: number;
  content: string;
  image: string | null;
  user: {
    id: number;
    username: string;
    name: string;
    profile_picture: string | null;
  };
  created_at: string;
  likes: number;
  reply: number;
  isLiked: boolean;
}

export interface SearchUser {
  id: number;
  username: string;
  name: string;
  bio: string | null;
  profilePicture: string | null;
  followersCount: number;
  followingCount: number;
}

export interface SearchResult {
  type: 'user' | 'post';
  user?: SearchUser;
  post?: Thread;
}
