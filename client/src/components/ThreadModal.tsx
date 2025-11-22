import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { updateThreadLikeStatus } from '../stores/postsSlice';
import { postsAPI } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useFetchComments } from '../hooks/useFetchComments';
import ReplyForm from './ReplyForm';
import ImageModal from './ImageModal';

interface Thread {
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
}

interface ThreadModalProps {
  thread: Thread | null;
  isOpen: boolean;
  onClose: () => void;
}

const ThreadModal: React.FC<ThreadModalProps> = ({ thread, isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { comments, loading: commentsLoading, refetch: refetchComments } = useFetchComments(thread?.id || 0, isOpen && thread !== null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Get the current thread state from Redux to ensure we have the latest like status
  const currentThread = useAppSelector((state) =>
    state.posts.threads.find(t => t.id === thread?.id)
  ) || thread;

  if (!isOpen || !thread) return null;

  const handleLike = async () => {
    if (!currentThread) return;

    // Optimistic update
    const newIsLiked = !currentThread.isLiked;
    const newLikeCount = newIsLiked ? currentThread.likes + 1 : currentThread.likes - 1;

    dispatch(updateThreadLikeStatus({
      threadId: currentThread.id,
      isLiked: newIsLiked,
      likesCount: newLikeCount
    }));

    try {
      const response = await postsAPI.toggleLike(currentThread.id.toString());
      if (response.code !== 200) {
        throw new Error('Failed to toggle like');
      }
      // Success - no need to revert since we're using server state
    } catch (err) {
      // Revert optimistic update on error
      dispatch(updateThreadLikeStatus({
        threadId: currentThread.id,
        isLiked: currentThread.isLiked,
        likesCount: currentThread.likes
      }));
      toast.error('Failed to toggle like. Please try again.');
    }
  };

  const handleReplySuccess = () => {
    refetchComments();
    setShowReplyForm(false); // Hide the form after successful reply
  };

  const openImageModal = () => {
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-20 p-2 bg-background border border-muted-foreground hover:bg-muted rounded-full transition-colors shadow-lg"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative max-w-4xl w-full mx-4 bg-background rounded-lg shadow-xl overflow-hidden h-5/6">

          <div className="flex h-full">
            {/* Left side - Image */}
            {thread.image && (
              <div className="w-1/2 p-6 overflow-hidden">
                <div className="h-full rounded-lg overflow-hidden bg-muted">
                  <img
                    src={`http://localhost:3000${thread.image}`}
                    alt="Post image"
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={openImageModal}
                  />
                </div>
              </div>
            )}

            {/* Right side - Thread content and replies */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
              {/* Thread content */}
              <Card className="mb-4 bg-card-post border-2 border-white shrink-0">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      <AvatarImage
                        src={(thread.user.id.toString() === user?.id && user?.profilePicture) ? `http://localhost:3000${user.profilePicture}` : (thread.user.profile_picture ? `http://localhost:3000${thread.user.profile_picture}` : undefined)}
                        alt={thread.user.username}
                      />
                      <AvatarFallback>{thread.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">{thread.user.name}</span>
                        <span className="text-muted-foreground text-sm">@{thread.user.username}</span>
                        <span className="text-muted-foreground text-xs">· {new Date(thread.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-2 text-sm">{thread.content}</p>
                    </div>
                  </div>
                  <div className="mt-4 translate-x-12 flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className="p-1 h-auto text-muted-foreground hover:text-foreground"
                    >
                      <Heart className={`h-3 w-3 mr-1 ${currentThread?.isLiked ? 'fill-current text-red-500' : ''}`} />
                      <span className="text-xs font-medium">{currentThread?.likes || 0}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReplyForm(!showReplyForm)}
                      className="p-1 h-auto text-muted-foreground hover:text-foreground"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      <span className="text-xs font-medium">{thread.reply || 0}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reply Form - only shown when comment button is clicked */}
              {showReplyForm && (
                <ReplyForm threadId={thread.id} onReplySuccess={handleReplySuccess} />
              )}

              {/* Replies */}
              <div className="flex-1 overflow-hidden">
                <h3 className="text-lg font-semibold mb-4">Replies</h3>
                {commentsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading replies...</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No replies yet.</p>
                ) : (
                  <ScrollArea className="h-full">
                    {comments.map((comment) => (
                      <div key={comment.id} className="mb-3 p-3 bg-card-reply rounded-lg border-2 border-white">
                        <div className="flex items-start space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage
                              src={(comment.user.id.toString() === user?.id && user?.profilePicture) ? `http://localhost:3000${user.profilePicture}` : (comment.user.profilePicture ? `http://localhost:3000${comment.user.profilePicture}` : undefined)}
                              alt={comment.user.username}
                            />
                            <AvatarFallback className="text-xs">{comment.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-xs">{comment.user.name}</span>
                              <span className="text-muted-foreground text-xs">@{comment.user.username}</span>
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
                    ))}
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal - rendered outside thread modal for proper z-index stacking */}
      {thread.image && (
        <ImageModal
          imageUrl={`http://localhost:3000${thread.image}`}
          isOpen={isImageModalOpen}
          onClose={closeImageModal}
        />
      )}
    </>
  );
};

export default ThreadModal;
