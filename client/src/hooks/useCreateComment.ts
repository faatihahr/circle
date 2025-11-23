import { useState } from 'react';
import { commentsAPI } from '../lib/api';
import { toast } from 'sonner';
import { useAppDispatch } from '../stores/hooks';
import { updateThreadReplyCount } from '../stores/postsSlice';

interface CreateCommentData {
  threadId: string;
  userId: string;
  content: string;
  parentId?: string;
  image?: File;
}

export const useCreateComment = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const createComment = async (data: CreateCommentData) => {
    if (!data.content.trim()) {
      toast.error('Content cannot be empty');
      return null;
    }

    setLoading(true);
    try {
      const response = await commentsAPI.createComment({
        threadId: data.threadId,
        userId: data.userId,
        content: data.content.trim(),
        parentId: data.parentId,
        image: data.image
      });

      if (response.code !== 201) {
        throw new Error('Failed to create comment');
      }

      // Update reply count immediately
      dispatch(updateThreadReplyCount({ threadId: parseInt(data.threadId), increment: 1 }));

      toast.success('Comment created successfully!', {
        className: 'bg-primary text-primary-foreground border-none',
        duration: 2000
      });
      return response.data;
    } catch (error) {
      toast.error('Failed to create comment. Please try again.');
      console.error('Error creating comment:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createComment, loading };
};
