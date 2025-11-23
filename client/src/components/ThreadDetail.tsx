import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { updateThreadLikeStatus, deselectThread } from '../stores/postsSlice';
import type { RootState } from '../stores/store';
import { postsAPI, commentsAPI } from '../lib/api';
import { toast } from 'sonner';
import ReplyForm from './ReplyForm';
import { useAuth } from '../contexts/AuthContext';

// Extended Comment type for nested replies
interface NestedComment {
  id: number;
  user_id: number;
  thread_id: number;
  parent_id?: number | null;
  content: string;
  image?: string;
  created_at: string;
  updated_at: string;
  user: {
    username: string;
    name: string;
    profilePicture?: string;
    id: number;
  };
  parent?: {
    id: number;
    user: {
      username: string;
    };
  };
  replies?: NestedComment[];
  comment_likes?: any[];
}

// CommentItem Component for nested display
interface CommentItemProps {
  comment: NestedComment;
  depth: number;
  onReplyToggle: (commentId: number | null) => void;
  replyingTo: number | null;
  onReplySuccess: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, depth, onReplyToggle, replyingTo, onReplySuccess }) => {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(comment.comment_likes?.length || 0);
  const [isLiked, setIsLiked] = useState(comment.comment_likes?.some(like => like.user_id === user?.id) || false);
  const [showReplies, setShowReplies] = useState(true);

  const handleToggleLike = async () => {
    try {
      const response = await commentsAPI.toggleCommentLike(comment.id.toString());
      if (response.code === 200) {
        setLikesCount(response.data.likesCount);
        setIsLiked(response.data.isLiked || false);
      }
    } catch (error) {
      toast.error('Failed to like comment');
    }
  };

  // Different styling for top-level vs nested comments
  const isNested = depth > 0;
  const hasReplies = comment.replies && comment.replies.length > 0;

  // Use conditional rendering instead of dynamic classes
  const getMarginClass = () => {
    if (depth === 0) return '';
    if (depth === 1) return 'ml-8';
    if (depth === 2) return 'ml-16';
    return 'ml-20'; // max depth margin
  };

  return (
    <div className={getMarginClass()}>
      {/* Comment Card */}
      <div className={`mb-3 rounded-xl transition-shadow ${
        isNested
          ? 'border-l-4 border-primary bg-card/50 p-3 hover:shadow-md'
          : 'bg-card border-2 border-white p-4 hover:shadow-lg shadow-sm'
      }`}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className={isNested ? 'w-9 h-9' : 'w-11 h-11'}>
            <AvatarImage
              src={(comment.user.id.toString() === user?.id && user?.profilePicture)
                ? `http://localhost:3000${user.profilePicture}`
                : (comment.user.profilePicture ? `http://localhost:3000${comment.user.profilePicture}` : undefined)}
              alt={comment.user.username}
            />
            <AvatarFallback className={`${isNested ? 'text-xs' : 'text-sm'} font-semibold bg-muted text-foreground`}>
              {comment.user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* User Info & Nested Badge */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`font-bold text-foreground ${isNested ? 'text-sm' : 'text-base'}`}>
                {comment.user.name}
              </span>
              <span className={`text-muted-foreground ${isNested ? 'text-xs' : 'text-sm'}`}>
                @{comment.user.username}
              </span>
              <span className={`text-muted-foreground ${isNested ? 'text-xs' : 'text-sm'}`}>
                · {new Date(comment.created_at).toLocaleDateString()}
              </span>
              {isNested && comment.parent?.user?.username && (
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
                  Reply to @{comment.parent.user.username}
                </span>
              )}
            </div>

            {/* Content */}
            <p className={`text-foreground mb-3 ${isNested ? 'text-sm' : 'text-base'}`}>
              {comment.content}
            </p>

            {/* Image */}
            {comment.image && (
              <div className={`bg-muted rounded-xl overflow-hidden mb-3 ${isNested ? 'max-h-32' : 'max-h-48'}`}>
                <img
                  src={`http://localhost:3000${comment.image}`}
                  alt="Comment image"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Action Buttons - Same as main thread buttons */}
            <div className="flex items-center space-x-4 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleLike}
                className="p-0 h-auto hover:bg-transparent"
              >
                <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                <span className="text-xs">{likesCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReplyToggle(comment.id)}
                className="p-0 h-auto hover:bg-transparent"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">Reply</span>
              </Button>

              {hasReplies && (
                <span
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  {showReplies ? (
                    <>Hide ({comment.replies!.length})</>
                  ) : (
                    <>View ({comment.replies!.length})</>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply form for this comment */}
      {replyingTo === comment.id && (
        <div className="mb-3">
          <ReplyForm
            threadId={comment.thread_id}
            parentId={comment.id}
            onReplySuccess={() => {
              onReplyToggle(null);
              onReplySuccess();
            }}
          />
        </div>
      )}

      {/* Recursive replies */}
      {hasReplies && showReplies && (
        <div className="space-y-2">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReplyToggle={onReplyToggle}
              replyingTo={replyingTo}
              onReplySuccess={onReplySuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ThreadDetail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedThreadId = useAppSelector((state: RootState) => state.posts.selectedThreadId);

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nestedComments, setNestedComments] = useState<NestedComment[]>([]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!selectedThreadId) return;

    const fetchThread = async () => {
      try {
        setLoading(true);
        const [threadResponse, commentsResponse] = await Promise.all([
          postsAPI.getPostById(selectedThreadId.toString()),
          commentsAPI.getCommentsByThread(selectedThreadId.toString())
        ]);

        if (threadResponse.code === 200) {
          setThread(threadResponse.data);
        }

        if (commentsResponse.code === 200) {
          setNestedComments(commentsResponse.data.comments);
        }
      } catch (err) {
        setError('Failed to load thread');
      } finally {
        setLoading(false);
      }
    };

    fetchThread();
  }, [selectedThreadId]);

  const handleToggleLike = async () => {
    if (!thread) return;

    try {
      const response = await postsAPI.toggleLike(thread.id.toString());
      if (response.code === 200) {
        dispatch(updateThreadLikeStatus({
          threadId: thread.id,
          isLiked: response.data.isLiked,
          likesCount: response.data.likesCount
        }));

        setThread((prevThread: any) => ({
          ...prevThread,
          isLiked: response.data.isLiked,
          likes: response.data.likesCount
        }));
      } else {
        throw new Error('Failed to toggle like');
      }
    } catch (err) {
      toast.error('Failed to toggle like. Please try again.');
    }
  };

  const handleReplySuccess = () => {
    if (selectedThreadId) {
      // Refresh both comments and thread data to update reply count
      Promise.all([
        commentsAPI.getCommentsByThread(selectedThreadId.toString()),
        postsAPI.getPostById(selectedThreadId.toString())
      ])
        .then(([commentsResponse, threadResponse]) => {
          if (commentsResponse.code === 200) {
            setNestedComments(commentsResponse.data.comments);
          }
          if (threadResponse.code === 200) {
            setThread(threadResponse.data);
          }
        })
        .catch(() => toast.error('Failed to refresh comments'));
    }
  };

  const handleBack = () => {
    dispatch(deselectThread());
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="flex-1 bg-background p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Loading thread...</p>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 pb-20">
        <div onClick={handleBack} className="mb-4 cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to posts</span>
        </div>
        <p className="text-center text-muted-foreground">{error || 'Thread not found'}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 pb-20">
      {/* Back Button */}
      <div
        onClick={handleBack}
        className="mb-4 flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Back to posts</span>
      </div>

      {/* Main Thread Post */}
      <Card className="mb-6 bg-card border-2 border-white shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 w-full">
          <div className="flex items-start space-x-3">
            <Avatar className="shrink-0 w-12 h-12">
              <AvatarImage
                src={(thread.user.id.toString() === user?.id && user?.profilePicture)
                  ? `http://localhost:3000${user.profilePicture}`
                  : (thread.user.profile_picture ? `http://localhost:3000${thread.user.profile_picture}` : undefined)}
                alt={thread.user.username}
              />
              <AvatarFallback className="bg-muted text-foreground font-semibold">
                {thread.user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-semibold text-sm">{thread.user.name}</span>
                <span className="text-muted-foreground text-sm">@{thread.user.username}</span>
                <span className="text-muted-foreground text-xs">
                  · {new Date(thread.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-sm wrap-break-word">{thread.content}</p>

              {thread.image && (
                <img
                  src={`http://localhost:3000${thread.image}`}
                  alt="Post image"
                  className="mt-3 w-full h-auto rounded-xl object-cover max-h-96"
                />
              )}

              <div className="flex items-center space-x-4 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleLike}
                  className="p-0 h-auto hover:bg-transparent"
                >
                  <Heart className={`h-4 w-4 mr-1 ${thread.isLiked ? 'fill-current text-red-500' : ''}`} />
                  <span className="text-xs">{thread.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span className="text-xs">{thread.reply || 0}</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reply Form */}
      <div className="mb-6">
        <ReplyForm threadId={thread.id} onReplySuccess={handleReplySuccess} />
      </div>

      {/* Replies Section */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Replies</h3>
        {nestedComments.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border-2 border-white">
            <p className="text-sm text-muted-foreground">No replies yet. Be the first to reply!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nestedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                onReplyToggle={setReplyingTo}
                replyingTo={replyingTo}
                onReplySuccess={handleReplySuccess}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadDetail;
