import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Calendar, MapPin, Tag } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { formatDistanceToNow } from "date-fns";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import type { PostgrestError } from "@supabase/supabase-js";

export type PostWithImages = {
  id: string;
  title: string;
  content: string;
  location: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  user_id: string;
  images?: { image_url: string; id: string }[];
  tags?: { name: string; id: string }[];
  user_vote?: { vote_type: "upvote" | "downvote" };
};

interface PostCardProps {
  post: PostWithImages;
  onVoteChange: () => void;
  onTagClick?: (tagName: string) => void;
}

export default function PostCard({
  post,
  onVoteChange,
  onTagClick,
}: PostCardProps) {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [currentImage, setCurrentImage] = useState(
    post.images && post.images.length > 0 ? post.images[0].image_url : null
  );

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!user) {
      toast.error("You must be logged in to vote.");
      return;
    }

    setIsVoting(true);

    try {
      // Check if user has already voted on this post
      const { data: existingVote } = await supabase
        .from("user_votes")
        .select("*")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .single();

      if (existingVote) {
        // If vote type is the same, remove the vote
        if (existingVote.vote_type === voteType) {
          await supabase.from("user_votes").delete().eq("id", existingVote.id);

          // Update post vote count
          await supabase
            .from("forum_posts")
            .update({
              [voteType === "upvote" ? "upvotes" : "downvotes"]:
                post[voteType === "upvote" ? "upvotes" : "downvotes"] - 1,
            })
            .eq("id", post.id);
        } else {
          // Change vote type
          await supabase
            .from("user_votes")
            .update({ vote_type: voteType })
            .eq("id", existingVote.id);

          // Update post vote counts
          await supabase
            .from("forum_posts")
            .update({
              [voteType === "upvote" ? "upvotes" : "downvotes"]:
                post[voteType === "upvote" ? "upvotes" : "downvotes"] + 1,
              [voteType === "upvote" ? "downvotes" : "upvotes"]:
                post[voteType === "upvote" ? "downvotes" : "upvotes"] - 1,
            })
            .eq("id", post.id);
        }
      } else {
        // Create new vote
        await supabase.from("user_votes").insert({
          post_id: post.id,
          user_id: user.id,
          vote_type: voteType,
        });

        // Update post vote count
        await supabase
          .from("forum_posts")
          .update({
            [voteType === "upvote" ? "upvotes" : "downvotes"]:
              post[voteType === "upvote" ? "upvotes" : "downvotes"] + 1,
          })
          .eq("id", post.id);
      }

      // Reload the posts
      onVoteChange();
    } catch (error: PostgrestError | Error) {
      toast.error(error.message || "Error processing vote");
      console.error("Error voting:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleTagClick = (tagName: string) => {
    if (onTagClick) {
      onTagClick(tagName);
    }
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="text-xl flex justify-between items-start">
          <span>{post.title}</span>
          <div className="flex items-center space-x-2 text-muted-foreground text-sm">
            <MapPin size={14} />
            <span>{post.location}</span>
          </div>
        </CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar size={14} className="mr-1" />
          <span>
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="whitespace-pre-line">{post.content}</p>

        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-2">
            <Tag size={14} className="text-muted-foreground" />
            {post.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleTagClick(tag.name)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {post.images && post.images.length > 0 && (
          <div className="space-y-2">
            <div>
              <img
                src={currentImage || post.images[0].image_url}
                alt="Location condition"
                className="w-full max-h-80 object-cover rounded-md"
              />
            </div>

            {post.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {post.images.map((image) => (
                  <img
                    key={image.id}
                    src={image.image_url}
                    alt="Thumbnail"
                    className={`h-16 w-16 object-cover rounded cursor-pointer ${
                      currentImage === image.image_url
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => setCurrentImage(image.image_url)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <div className="flex space-x-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                variant={
                  post.user_vote?.vote_type === "upvote" ? "default" : "outline"
                }
                size="sm"
                onClick={() => handleVote("upvote")}
                disabled={isVoting}
              >
                <ThumbsUp size={16} className="mr-1" />
                {post.upvotes}
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-48">
              <p className="text-sm">
                {user
                  ? "Click to upvote this post"
                  : "Sign in to upvote this post"}
              </p>
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                variant={
                  post.user_vote?.vote_type === "downvote"
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => handleVote("downvote")}
                disabled={isVoting}
              >
                <ThumbsDown size={16} className="mr-1" />
                {post.downvotes}
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-48">
              <p className="text-sm">
                {user
                  ? "Click to downvote this post"
                  : "Sign in to downvote this post"}
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </CardFooter>
    </Card>
  );
}
