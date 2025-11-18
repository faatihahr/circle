import { useState } from 'react';
import { postsAPI } from '../lib/api';
import { toast } from 'sonner';

export interface LikeResult {
  isLiked: boolean;
  likesCount: number;
}

export const useToggleLike = () => {
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = async (
    postId: number,
    currentIsLiked: boolean,
    currentLikesCount: number,
    onOptimisticUpdate: (result: LikeResult) => void,
    onError: () => void
  ): Promise<LikeResult | null> => {
    if (isLoading) return null;

    setIsLoading(true);

    // Calculate optimistic values
    const optimisticIsLiked = !currentIsLiked;
    const optimisticLikesCount = currentIsLiked
      ? currentLikesCount - 1
      : currentLikesCount + 1;

    // Apply optimistic update immediately
    const optimisticResult = {
      isLiked: optimisticIsLiked,
      likesCount: optimisticLikesCount
    };
    onOptimisticUpdate(optimisticResult);

    try {
      const response = await postsAPI.toggleLike(postId.toString());

      if (response.code === 200) {
        // Return actual server response
        return {
          isLiked: response.data.isLiked,
          likesCount: response.data.likesCount
        };
      } else {
        throw new Error(response.message || 'Failed to toggle like');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like. Please try again.');

      // Revert optimistic update on error
      onError();

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { toggleLike, isLoading };
};
