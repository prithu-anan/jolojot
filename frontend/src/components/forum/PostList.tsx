import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import PostCard, { PostWithImages } from "./PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Plus, Search, RefreshCw, X, Tag } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";

type TagType = {
  id: string;
  name: string;
};

export default function PostList() {
  const [posts, setPosts] = useState<PostWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Fetch all posts
      const { data: posts, error } = await supabase
        .from("forum_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!posts) return setPosts([]);

      // Fetch tags for each post and images
      const postsWithImagesAndTags = await Promise.all(
        posts.map(async (post) => {
          // Fetch images for the post
          const { data: images, error: imgError } = await supabase
            .from("post_images")
            .select("id, image_url")
            .eq("post_id", post.id);

          if (imgError) console.error("Error fetching images:", imgError);

          // Fetch tags for the post using a custom query
          const { data: postTags, error: tagsError } = await supabase
            .from("post_tags")
            .select(
              `
              tag:tags(id, name)
            `
            )
            .eq("post_id", post.id);

          if (tagsError) console.error("Error fetching tags:", tagsError);

          // Transform tags into the expected format
          const tags = postTags?.map((item) => item.tag) || [];

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
            tags: tags as TagType[],
            user_vote: userVote,
          };
        })
      );

      setPosts(postsWithImagesAndTags);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error fetching posts";
      toast.error(errorMessage);
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      // Get all tags that are actually used in posts
      const { data, error } = await supabase.from("post_tags").select(`
          tag:tags(id, name),
          post_id
        `);

      if (error) throw error;

      // Count occurrences and sort by frequency
      const tagCounts = new Map<
        string,
        { id: string; name: string; count: number }
      >();

      data?.forEach((item) => {
        const tag = item.tag as TagType;
        if (!tag) return;

        const existingTag = tagCounts.get(tag.id);
        if (existingTag) {
          existingTag.count += 1;
        } else {
          tagCounts.set(tag.id, {
            id: tag.id,
            name: tag.name,
            count: 1,
          });
        }
      });

      // Convert to array and sort
      const sortedTags = Array.from(tagCounts.values())
        .sort((a, b) => b.count - a.count)
        .map(({ id, name }) => ({ id, name }));

      setAvailableTags(sortedTags);
    } catch (error: unknown) {
      console.error("Error fetching tags:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchTags();
  }, [user]);

  const handleTagSelect = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const filteredPosts = posts.filter((post) => {
    // Filter by search term
    const searchMatch =
      !searchTerm ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.location.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by selected tags
    const tagMatch =
      selectedTags.length === 0 ||
      selectedTags.every((tag) =>
        post.tags?.some((postTag) => postTag.name === tag)
      );

    return searchMatch && tagMatch;
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
            onClick={() => {
              fetchPosts();
              fetchTags();
            }}
            title="Refresh posts"
          >
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate("/forum/create")}>
            <Plus size={18} className="mr-2" /> New Post
          </Button>
        </div>
      </div>

      {availableTags.length > 0 && (
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center">
            <Tag size={16} className="mr-1 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mr-2">
              Filter by tags:
            </span>
          </div>

          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSelectedTags([])}
            >
              <X size={14} className="mr-1" /> Clear
            </Button>
          )}

          {availableTags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.name) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleTagSelect(tag.name)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

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
              onTagClick={handleTagSelect}
            />
          ))}
        </div>
      ) : searchTerm || selectedTags.length > 0 ? (
        <div className="text-center py-10">
          <p>No posts match your search criteria.</p>
          <div className="flex justify-center mt-2 gap-2">
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            )}
            {selectedTags.length > 0 && (
              <Button variant="outline" onClick={() => setSelectedTags([])}>
                Clear Tag Filters
              </Button>
            )}
          </div>
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
