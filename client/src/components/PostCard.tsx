import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { useAppDispatch } from '../stores/hooks';
import { updateThreadLikeStatus } from '../stores/postsSlice';
import { postsAPI } from '../lib/api';
import { toast } from 'sonner';
import ReplyForm from './ReplyForm';
import { useFetchComments, type Comment } from '../hooks/useFetchComments';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

interface PostCardProps {
  thread: {
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
  };
  onLikeUpdate?: (threadId: number, isLiked: boolean, likesCount: number) => void;
  onReplyUpdate?: (threadId: number, replyCount: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({ thread, onLikeUpdate, onReplyUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(thread.likes);
  const [isLikedState, setIsLikedState] = useState(thread.isLiked);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { comments, loading: commentsLoading, refetch: refetchComments } = useFetchComments(thread.id, isCommentsOpen);

  const handleLikeButtonClick = async () => {
    if (onLikeUpdate) {
      // Use callback for local state management (e.g., profile view)
      const newIsLiked = !isLikedState;
      const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

      // Optimistic update
      setIsLikedState(newIsLiked);
      setLikesCount(newLikesCount);

      try {
        const response = await postsAPI.toggleLike(thread.id.toString());
        if (response.code !== 200) {
          throw new Error('Failed to toggle like');
        }
        // Call callback to update parent state
        onLikeUpdate(thread.id, newIsLiked, newLikesCount);
      } catch (error) {
        // Revert optimistic update on error
        setIsLikedState(!newIsLiked);
        setLikesCount(thread.likes);
        toast.error('Failed to toggle like. Please try again.');
      }
    } else {
      // Original Redux-based logic for main feed
      if (thread.isLiked) {
        await handleUnlike();
      } else {
        await handleLike();
      }
    }
  };

  const handleLike = async () => {
    // Update Redux state optimistically
    dispatch(updateThreadLikeStatus({
      threadId: thread.id,
      isLiked: true,
      likesCount: thread.likes + 1
    }));

    // Send request to server
    try {
      const response = await postsAPI.toggleLike(thread.id.toString());
      if (response.code !== 200) {
        throw new Error('Failed to like post');
      }
    } catch (error) {
      // Revert optimistic update on error
      dispatch(updateThreadLikeStatus({
        threadId: thread.id,
        isLiked: false,
        likesCount: thread.likes
      }));
      toast.error('Failed to like post. Please try again.');
    }
  };

  const handleUnlike = async () => {
    // Update Redux state optimistically
    dispatch(updateThreadLikeStatus({
      threadId: thread.id,
      isLiked: false,
      likesCount: thread.likes - 1
    }));

    // Send request to server
    try {
      const response = await postsAPI.toggleLike(thread.id.toString());
      if (response.code !== 200) {
        throw new Error('Failed to unlike post');
      }
    } catch (error) {
      // Revert optimistic update on error
      dispatch(updateThreadLikeStatus({
        threadId: thread.id,
        isLiked: true,
        likesCount: thread.likes
      }));
      toast.error('Failed to unlike post. Please try again.');
    }
  };

  const handleReply = () => {
    setIsReplyOpen(!isReplyOpen);
  };

  const handleReplySuccess = () => {
    setIsReplyOpen(false);
    if (onReplyUpdate) {
      // Update reply count for profile view
      onReplyUpdate(thread.id, thread.reply + 1);
    }
    if (isCommentsOpen) {
      refetchComments(); // Refresh comments list
    }
  };

  const handleViewReplies = () => {
    setIsCommentsOpen(!isCommentsOpen);
  };

  const handleUserClick = (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  return (
    <>
      <Card className="mb-4  bg-card-post cursor-pointer border-2 border-white hover:shadow-xl transition-shadow duration-200" onClick={() => navigate(`/thread/${thread.id}`)}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar onClick={(e) => handleUserClick(thread.user.id, e)} className="cursor-pointer">
              <AvatarImage
                src={(thread.user.id.toString() === user?.id && user?.profilePicture) ? `http://localhost:3000${user.profilePicture}` : (thread.user.profile_picture ? `http://localhost:3000${thread.user.profile_picture}` : undefined)}
                alt={thread.user.username}
              />
              <AvatarFallback>{thread.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm cursor-pointer hover:underline" onClick={(e) => handleUserClick(thread.user.id, e)}>{thread.user.name}</span>
                <span className="text-muted-foreground text-sm cursor-pointer hover:underline" onClick={(e) => handleUserClick(thread.user.id, e)}>@{thread.user.username}</span>
                <span className="text-muted-foreground text-xs">· {new Date(thread.created_at).toLocaleDateString()}</span>
              </div>
              <p className={`mt-2 text-sm ${!isExpanded ? 'line-clamp-1' : ''}`}>{thread.content}</p>
              <span
                className="mt-1 text-xs text-secondary-foreground underline cursor-pointer"
                onClick={(e) => {e.stopPropagation(); setIsExpanded(!isExpanded);}}
              >
                {isExpanded ? 'See less' : 'See more'}
              </span>
              {thread.image && (
                <img
                  src={`http://localhost:3000${thread.image}`}
                  alt="Post image"
                  className="mt-1 max-w-60 h-auto w-auto object-contain rounded-xl"
                />
              )}
              <div className="flex items-center space-x-4 mt-3">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleLikeButtonClick(); }} className="p-0 h-auto">
                  <Heart className={`h-4 w-4 mr-1 ${onLikeUpdate ? (isLikedState ? 'fill-current text-red-500' : '') : (thread.isLiked ? 'fill-current text-red-500' : '')}`} />
                  <span className="text-xs">{onLikeUpdate ? likesCount : thread.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleReply(); }} className="p-0 h-auto">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span className="text-xs">{thread.reply}</span>
                </Button>
                {thread.reply > 0 && (
                  <span
                    className="text-xs text-secondary-foreground underline cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); handleViewReplies(); }}
                  >
                    {isCommentsOpen ? '[Hide replies]' : '[View replies]'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {isReplyOpen && (
        <ReplyForm threadId={thread.id} onReplySuccess={handleReplySuccess} />
      )}
      {isCommentsOpen && (
        <div className="ml-12 mb-4">
          {commentsLoading ? (
            <p className="text-sm text-muted-foreground">Loading replies...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No replies yet.</p>
          ) : (
            comments.map((comment: Comment) => (
              <div key={comment.id} className="mb-3 p-3 bg-card-reply rounded-lg border-2 border-white">
                <div className="flex items-start space-x-2">
                  <Avatar className="w-6 h-6 cursor-pointer" onClick={(e) => handleUserClick(comment.user.id, e)}>
                    <AvatarImage
                      src={(comment.user.id.toString() === user?.id && user?.profilePicture) ? `http://localhost:3000${user.profilePicture}` : (comment.user.profilePicture ? `http://localhost:3000${comment.user.profilePicture}` : undefined)}
                      alt={comment.user.username}
                    />
                    <AvatarFallback className="text-xs">{comment.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-xs cursor-pointer hover:underline" onClick={(e) => handleUserClick(comment.user.id, e)}>{comment.user.name}</span>
                      <span className="text-muted-foreground text-xs cursor-pointer hover:underline" onClick={(e) => handleUserClick(comment.user.id, e)}>@{comment.user.username}</span>
                      <span className="text-muted-foreground text-xs">· {new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    {comment.image && (
                      <img
                        src={`http://localhost:3000${comment.image}`}
                        alt="Comment image"
                        className="mt-2 max-w-32 h-auto rounded"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};


export default PostCard;
