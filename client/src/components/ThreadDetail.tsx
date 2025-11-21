import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Heart, MessageCircle, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { updateThreadLikeStatus, deselectThread } from '../stores/postsSlice';
import type { RootState } from '../stores/store';
import { postsAPI } from '../lib/api';
import { toast } from 'sonner';
import ReplyForm from './ReplyForm';
import { useFetchComments, type Comment } from '../hooks/useFetchComments';
import { useAuth } from '../contexts/AuthContext';

const ThreadDetail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedThreadId = useAppSelector((state: RootState) => state.posts.selectedThreadId);
  const threads = useAppSelector((state: RootState) => state.posts.threads);

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localLikeState, setLocalLikeState] = useState<{ isLiked: boolean; likesCount: number } | null>(null);

  const { comments, loading: commentsLoading, refetch: refetchComments } = useFetchComments(selectedThreadId!, selectedThreadId !== null);
  const { user } = useAuth();

  useEffect(() => {
    if (!selectedThreadId) return;

    const fetchThread = async () => {
      try {
        setLoading(true);
        const response = await postsAPI.getPostById(selectedThreadId.toString());
        if (response.code === 200) {
          setThread(response.data);
        } else {
          throw new Error('Failed to fetch thread');
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
        // Update Redux state
        dispatch(updateThreadLikeStatus({
          threadId: thread.id,
          isLiked: response.data.isLiked,
          likesCount: response.data.likesCount
        }));

        // Update local thread state for immediate UI update
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
    refetchComments();
  };

  const handleBack = () => {
    dispatch(deselectThread());
    navigate('/home');
  };

  if (loading) {
    return <div className="flex-1 bg-card p-4">Loading thread...</div>;
  }

  if (error || !thread) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div onClick={handleBack} className="mb-4 cursor-pointer text-muted-foreground hover:text-foreground">
          &larr; Back to posts
        </div>
        <p>{error || 'Thread not found'}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div onClick={handleBack} className="mb-4 flex items-center cursor-pointer text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to posts
      </div>

      <Card className="mb-4 bg-card-post border-2 border-white">
        <CardContent className="p-4 w-full">
          <div className="flex items-start space-x-3">
            <Avatar className="flex-shrink-0">
              <AvatarImage
                src={(thread.user.id.toString() === user?.id && user?.profilePicture) ? `http://localhost:3000${user.profilePicture}` : (thread.user.profile_picture ? `http://localhost:3000${thread.user.profile_picture}` : undefined)}
                alt={thread.user.username}
              />
              <AvatarFallback>{thread.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm">{thread.user.name}</span>
                <span className="text-muted-foreground text-sm">@{thread.user.username}</span>
                <span className="text-muted-foreground text-xs">· {new Date(thread.created_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-2 text-sm break-words">{thread.content}</p>
              
              {thread.image ? (
                <img
                  src={`http://localhost:3000${thread.image}`}
                  alt="Post image"
                  className="mt-2 w-full h-auto rounded-xl object-cover"
                />
              ) : (
                <div className="mt-2 w-full min-h-[400px] rounded-xl bg-muted/20 flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">No image</span>
                </div>
              )}

              <div className="flex items-center space-x-4 mt-3">
                <Button variant="ghost" size="sm" onClick={handleToggleLike} className="p-0 h-auto">
                  <Heart className={`h-4 w-4 mr-1 ${thread.isLiked ? 'fill-current text-red-500' : ''}`} />
                  <span className="text-xs">{thread.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span className="text-xs">{thread.replies || 0}</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReplyForm threadId={thread.id} onReplySuccess={handleReplySuccess} />

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Replies</h3>
        {commentsLoading ? (
          <p className="text-sm text-muted-foreground">Loading replies...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No replies yet.</p>
        ) : (
          <ScrollArea className="max-h-96">
            {comments.map((comment: Comment) => (
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
  );
};

export default ThreadDetail;
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Card, CardContent } from './ui/card';
// import { ScrollArea } from './ui/scroll-area';
// import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
// import { Button } from './ui/button';
// import { Heart, MessageCircle, ArrowLeft } from 'lucide-react';
// import { useAppDispatch, useAppSelector } from '../stores/hooks';
// import { updateThreadLikeStatus, deselectThread } from '../stores/postsSlice';
// import type { RootState } from '../stores/store';
// import { postsAPI } from '../lib/api';
// import { toast } from 'sonner';
// import ReplyForm from './ReplyForm';
// import { useFetchComments, type Comment } from '../hooks/useFetchComments';
// import { useAuth } from '../contexts/AuthContext';

// const ThreadDetail: React.FC = () => {
//   const navigate = useNavigate();
//   const dispatch = useAppDispatch();
//   const selectedThreadId = useAppSelector((state: RootState) => state.posts.selectedThreadId);
//   const threads = useAppSelector((state: RootState) => state.posts.threads);

//   const [thread, setThread] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [localLikeState, setLocalLikeState] = useState<{ isLiked: boolean; likesCount: number } | null>(null);

//   const { comments, loading: commentsLoading, refetch: refetchComments } = useFetchComments(selectedThreadId!, selectedThreadId !== null);
//   const { user } = useAuth();

//   useEffect(() => {
//     if (!selectedThreadId) return;

//     const fetchThread = async () => {
//       try {
//         setLoading(true);
//         const response = await postsAPI.getPostById(selectedThreadId.toString());
//         if (response.code === 200) {
//           setThread(response.data);
//         } else {
//           throw new Error('Failed to fetch thread');
//         }
//       } catch (err) {
//         setError('Failed to load thread');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchThread();
//   }, [selectedThreadId]);

//   const handleToggleLike = async () => {
//     if (!thread) return;

//     try {
//       const response = await postsAPI.toggleLike(thread.id.toString());
//       if (response.code === 200) {
//         // Update Redux state
//         dispatch(updateThreadLikeStatus({
//           threadId: thread.id,
//           isLiked: response.data.isLiked,
//           likesCount: response.data.likesCount
//         }));

//         // Update local thread state for immediate UI update
//         setThread((prevThread: any) => ({
//           ...prevThread,
//           isLiked: response.data.isLiked,
//           likes: response.data.likesCount
//         }));
//       } else {
//         throw new Error('Failed to toggle like');
//       }
//     } catch (err) {
//       toast.error('Failed to toggle like. Please try again.');
//     }
//   };

//   const handleReplySuccess = () => {
//     refetchComments();
//   };

//   const handleBack = () => {
//     dispatch(deselectThread());
//     navigate('/home');
//   };

//   if (loading) {
//     return <div className="flex-1 bg-card p-4">Loading thread...</div>;
//   }

//   if (error || !thread) {
//     return (
//       <div className="max-w-2xl mx-auto p-4">
//         <div onClick={handleBack} className="mb-4 cursor-pointer text-muted-foreground hover:text-foreground">
//           &larr; Back to posts
//         </div>
//         <p>{error || 'Thread not found'}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-2xl mx-auto p-4">
//       <div onClick={handleBack} className="mb-4 flex items-center cursor-pointer text-muted-foreground hover:text-foreground">
//         <ArrowLeft className="w-4 h-4 mr-2" />
//         Back to posts
//       </div>

//       <Card className="mb-4 bg-card-post border-2 border-white ${!thread.image ? 'flex-1' : ''}">
//         <CardContent className="p-4">
//           <div className="flex items-start space-x-3">
//             <Avatar>
//               <AvatarImage
//                 src={(thread.user.id.toString() === user?.id && user?.profilePicture) ? `http://localhost:3000${user.profilePicture}` : (thread.user.profile_picture ? `http://localhost:3000${thread.user.profile_picture}` : undefined)}
//                 alt={thread.user.username}
//               />
//               <AvatarFallback>{thread.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
//             </Avatar>
//             <div className="flex flex-col gap-1 flex-1">
//               <div className="flex items-center space-x-2">
//                 <span className="font-semibold text-sm">{thread.user.name}</span>
//                 <span className="text-muted-foreground text-sm">@{thread.user.username}</span>
//                 <span className="text-muted-foreground text-xs">· {new Date(thread.created_at).toLocaleDateString()}</span>
//               </div>
//               <p className="mt-2 text-sm">{thread.content}</p>
//               {thread.image && (
//                 <img
//                   src={`http://localhost:3000${thread.image}`}
//                   alt="Post image"
//                   className="mt-1 max-w-full h-auto rounded-xl"
//                 />
//               )}
//               <div className="flex items-center space-x-4 mt-3">
//                 <Button variant="ghost" size="sm" onClick={handleToggleLike} className="p-0 h-auto">
//                   <Heart className={`h-4 w-4 mr-1 ${thread.isLiked ? 'fill-current text-red-500' : ''}`} />
//                   <span className="text-xs">{thread.likes}</span>
//                 </Button>
//                 <Button variant="ghost" size="sm" className="p-0 h-auto">
//                   <MessageCircle className="h-4 w-4 mr-1" />
//                   <span className="text-xs">{thread.replies || 0}</span>
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <ReplyForm threadId={thread.id} onReplySuccess={handleReplySuccess} />

//       <div className="mt-6">
//         <h3 className="text-lg font-semibold mb-4">Replies</h3>
//         {commentsLoading ? (
//           <p className="text-sm text-muted-foreground">Loading replies...</p>
//         ) : comments.length === 0 ? (
//           <p className="text-sm text-muted-foreground">No replies yet.</p>
//         ) : (
//           <ScrollArea className="max-h-96">
//             {comments.map((comment: Comment) => (
//               <div key={comment.id} className="mb-3 p-3 bg-card-reply rounded-lg border-2 border-white">
//                 <div className="flex items-start space-x-2">
//                   <Avatar className="w-6 h-6">
//                     <AvatarImage
//                       src={(comment.user.id.toString() === user?.id && user?.profilePicture) ? `http://localhost:3000${user.profilePicture}` : (comment.user.profilePicture ? `http://localhost:3000${comment.user.profilePicture}` : undefined)}
//                       alt={comment.user.username}
//                     />
//                     <AvatarFallback className="text-xs">{comment.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
//                   </Avatar>
//                   <div className="flex-1">
//                     <div className="flex items-center space-x-2 mb-1">
//                       <span className="font-semibold text-xs">{comment.user.name}</span>
//                       <span className="text-muted-foreground text-xs">@{comment.user.username}</span>
//                       <span className="text-muted-foreground text-xs">· {new Date(comment.created_at).toLocaleDateString()}</span>
//                     </div>
//                     <p className="text-sm">{comment.content}</p>
//                     {comment.image && (
//                       <img
//                         src={`http://localhost:3000${comment.image}`}
//                         alt="Comment image"
//                         className="mt-2 max-w-32 h-auto rounded"
//                       />
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </ScrollArea>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ThreadDetail;
