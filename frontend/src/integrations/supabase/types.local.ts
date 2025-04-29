
// Local types for Supabase tables - do not modify types.ts which is generated

export type ForumPost = {
  id: string;
  title: string;
  content: string;
  location: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  upvotes: number;
  downvotes: number;
};

export type PostImage = {
  id: string;
  post_id: string;
  image_url: string;
  created_at: string;
};

export type UserVote = {
  id: string;
  user_id: string;
  post_id: string;
  vote_type: 'upvote' | 'downvote';
  created_at: string;
};
