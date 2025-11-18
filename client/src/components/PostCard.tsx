import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { useAppDispatch } from '../stores/hooks';
import { updateThreadLikeStatus } from '../stores/postsSlice';
import { postsAPI } from '../lib/api';
import { toast } from 'sonner';

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
}

const PostCard: React.FC<PostCardProps> = ({ thread }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [aspectMode, setAspectMode] = useState<string>('square');
  const dispatch = useAppDispatch();

  const handleLikeButtonClick = async () => {
    if (thread.isLiked) {
      await handleUnlike();
    } else {
      await handleLike();
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
    // TODO: implement reply functionality
    console.log('Reply to post', thread.id);
  };

  useEffect(() => {
    if (!thread.image) return;
    const img = new Image();
    img.src = `http://localhost:3000${thread.image}`;
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      let mode: string;
      if (ratio >= 1.2) mode = 'landscape'; // approximate for 1.91:1
      else if (ratio <= 0.833) mode = 'vertical'; // approximate for 4:5
      else mode = 'square';
      setAspectMode(mode);
    };
  }, [thread.image]);

  const getDetailAspectClass = () => {
    switch (aspectMode) {
      case 'square':
        return 'aspect-square';
      case 'vertical':
        return 'aspect-[4/5]';
      case 'landscape':
        return 'aspect-[1.91/1]';
      default:
        return 'aspect-square';
    }
  };

  return (
    <>
      <Card className="mb-4  bg-card-post cursor-pointer border-0 hover:shadow-xl transition-shadow duration-200" onClick={() => setIsDetailOpen(true)}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar>
              <AvatarImage
                src={thread.user.profile_picture || undefined}
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
                  <Heart className={`h-4 w-4 mr-1 ${thread.isLiked ? 'fill-current text-red-500' : ''}`} />
                  <span className="text-xs">{thread.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleReply(); }} className="p-0 h-auto">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span className="text-xs">{thread.reply}</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {isDetailOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setIsDetailOpen(false)}
        >
          <img
            src={`http://localhost:3000${thread.image}`}
            alt="Post image detail"
            className={`max-w-screen-sm max-h-screen object-contain ${getDetailAspectClass()} rounded`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default PostCard;
