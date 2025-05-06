import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { TagInput } from "@/components/ui/tag-input";
import type { PostgrestError } from "@supabase/supabase-js";

export default function CreatePostForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(filesArray);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to create a post.");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, insert the post
      const { data: postData, error: postError } = await supabase
        .from("forum_posts")
        .insert({
          title,
          content,
          location,
          user_id: user.id,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Add tags if any exist
      if (tags.length > 0) {
        // Call the create_tags_if_not_exist function using RPC
        const { data: tagIds, error: tagError } = await supabase.rpc(
          "create_tags_if_not_exist",
          { tag_names: tags }
        );

        if (tagError) throw tagError;

        // Link tags to post
        if (tagIds && tagIds.length > 0) {
          const postTagsData = tagIds.map((tagId) => ({
            post_id: postData.id,
            tag_id: tagId,
          }));

          const { error: linkError } = await supabase
            .from("post_tags")
            .insert(postTagsData);

          if (linkError) throw linkError;
        }
      }

      // Then upload any images if they exist
      if (images.length > 0) {
        for (const image of images) {
          const fileName = `${Date.now()}-${image.name}`;
          const { error: uploadError } = await supabase.storage
            .from("post_images")
            .upload(fileName, image);

          if (uploadError) throw uploadError;

          // Get the public URL
          const { data: urlData } = supabase.storage
            .from("post_images")
            .getPublicUrl(fileName);

          // Save the image reference to the post_images table
          const { error: imageRefError } = await supabase
            .from("post_images")
            .insert({
              post_id: postData.id,
              image_url: urlData.publicUrl,
            });

          if (imageRefError) throw imageRefError;
        }
      }

      toast.success("Post created successfully!");
      navigate("/forum");
    } catch (error: PostgrestError | Error) {
      toast.error(error.message || "Error creating post");
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State or specific location"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder="Add tags (e.g., rain, flooding, snow)..."
              maxTags={5}
            />
            <p className="text-xs text-muted-foreground">
              Press Enter or Space to add a tag (max 5)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe the location conditions..."
              className="w-full min-h-[150px] px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Images (Optional)</Label>
            <Input
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Upload images of the location conditions
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/forum")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
