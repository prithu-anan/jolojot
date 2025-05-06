-- Create table for tags
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create junction table for post_tags relationship
CREATE TABLE IF NOT EXISTS public.post_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, tag_id)
);

-- Create index on post_id for faster queries
CREATE INDEX IF NOT EXISTS post_tags_post_id_idx ON public.post_tags(post_id);
CREATE INDEX IF NOT EXISTS post_tags_tag_id_idx ON public.post_tags(tag_id);

-- Create function to create tags if they don't exist and return their IDs
CREATE OR REPLACE FUNCTION public.create_tags_if_not_exist(tag_names text[])
RETURNS uuid[] AS $$
DECLARE
  tag_ids uuid[];
  tag_name text;
  tag_id uuid;
BEGIN
  tag_ids := ARRAY[]::uuid[];
  
  FOREACH tag_name IN ARRAY tag_names
  LOOP
    -- Try to insert the tag if it doesn't exist
    INSERT INTO public.tags (name)
    VALUES (tag_name)
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO tag_id;
    
    -- If tag already existed, get its ID
    IF tag_id IS NULL THEN
      SELECT id INTO tag_id FROM public.tags WHERE name = tag_name;
    END IF;
    
    -- Add tag_id to the array
    tag_ids := array_append(tag_ids, tag_id);
  END LOOP;
  
  RETURN tag_ids;
END;
$$ LANGUAGE plpgsql; 