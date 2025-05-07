
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import PostCard, { PostWithImages } from "./PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Plus, Search, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/sonner";

export default function PostList() {
  const [posts, setPosts] = useState<PostWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Fetch all posts
      let { data: posts, error } = await supabase
        .from("forum_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!posts) posts = [];

      // Fetch images for each post
      const postsWithImages = await Promise.all(
        posts.map(async (post) => {
          const { data: images, error: imgError } = await supabase
            .from("post_images")
            .select("id, image_url")
            .eq("post_id", post.id);

          if (imgError) console.error("Error fetching images:", imgError);

          // If user is logged in, check their vote on this post
          let userVote = null;
          if (user) {
            const { data: vote, error: voteError } = await supabase
              .from("user_votes")
              .select("vote_type")
              .eq("post_id", post.id)
              .eq("user_id", user.id)
              .single();

            if (voteError && voteError.code !== "PGRST116") {
              console.error("Error fetching user vote:", voteError);
            }
            userVote = vote;
          }

          return {
            ...post,
            images: images || [],
            user_vote: userVote
          };
        })
      );

      setPosts(postsWithImages);
    } catch (error: any) {
      toast.error(error.message || "Error fetching posts");
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const filteredPosts = posts.filter(post => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      post.title.toLowerCase().includes(search) || 
      post.content.toLowerCase().includes(search) ||
      post.location.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts by title, content or location..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={fetchPosts}
            title="Refresh posts"
          >
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate("/forum/create")}>
            <Plus size={18} className="mr-2" /> New Post
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading posts...</p>
        </div>
      ) : filteredPosts.length > 0 ? (
        <div>
          {filteredPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onVoteChange={fetchPosts} 
            />
          ))}
        </div>
      ) : searchTerm ? (
        <div className="text-center py-10">
          <p>No posts match your search.</p>
          <Button variant="outline" className="mt-2" onClick={() => setSearchTerm("")}>
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="text-center py-10">
          <p>No posts yet. Be the first to share a location condition!</p>
          <Button className="mt-2" onClick={() => navigate("/forum/create")}>
            Create Post
          </Button>
        </div>
      )}
    </div>
  );
}
