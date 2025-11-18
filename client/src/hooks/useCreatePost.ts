import { useState } from 'react';
import { postsAPI } from '../lib/api';
import { toast } from 'sonner';
import { useAppDispatch } from '../stores/hooks';
import { addNewThread } from '../stores/postsSlice';

interface CreatePostData {
  content: string;
  image?: File;
}

export const useCreatePost = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const createPost = async (data: CreatePostData) => {
    if (!data.content.trim()) {
      toast.error('Content cannot be empty');
      return null;
    }

    setLoading(true);
    try {
      const response = await postsAPI.createPost({
        content: data.content.trim(),
        image: data.image
      });

      if (response.code !== 201) {
        throw new Error('Failed to create post');
      }

      // Add new post to state immediately for instant UI update
      const post = response.data;
      const newThread = {
        id: post.id,
        content: post.content,
        image: post.image,
        user: {
          id: post.user_created.id,
          username: post.user_created.username,
          name: post.user_created.name,
          profile_picture: post.user_created.profilePicture
        },
        created_at: post.created_at,
        likes: post.likes.length,
        reply: post.comments.length,
        comments: post.comments,
        isLiked: false 
      };
      dispatch(addNewThread(newThread));

      toast.success('Post created successfully!', {
        className: 'bg-primary text-primary-foreground border-none',
        duration: 2000
      });
      return response.data;
    } catch (error) {
      toast.error('Failed to create post. Please try again.');
      console.error('Error creating post:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createPost, loading };
};
