import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { useCreateComment } from '../hooks/useCreateComment';

interface ReplyFormProps {
  threadId: number;
  onReplySuccess?: () => void;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ threadId, onReplySuccess }) => {
  const { user } = useAuth();
  const { createComment, loading } = useCreateComment();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };

    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newComment = await createComment({
      threadId: threadId.toString(),
      userId: user.id.toString(),
      content,
      image: image || undefined
    });
    if (newComment) {
      setContent('');
      setImage(null);
      setExpanded(false);
      onReplySuccess?.();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  return (
    <Card ref={cardRef} className={`mt-4 bg-card-reply border-2 border-white ${expanded ? 'mb-2' : 'mb-4'}`}>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start space-x-3">
          <Avatar>
            <AvatarImage
              src={user?.profilePicture ? `http://localhost:3000${user.profilePicture}` : undefined}
              alt={user?.username}
            />
            <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setExpanded(true)}
              onClick={() => setExpanded(true)}
              placeholder="Write a reply..."
              className="w-full text-sm bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground rounded-lg transition-all duration-200"
              rows={expanded ? 2 : 1}
              style={{ minHeight: expanded ? '64px' : '40px' }}
            />
          </div>
          {expanded && (
            <>
              {image && (
                <div className="relative mt-2">
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Preview"
                    className="max-w-full h-auto rounded-xl max-h-32 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    ×
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`image-upload-${threadId}`} className="cursor-pointer text-primary hover:text-primary/80">
                    📎 Attach image
                  </Label>
                  <Input
                    id={`image-upload-${threadId}`}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <Button type="submit" disabled={loading || !content.trim()}>
                  {loading ? 'Sending...' : 'Reply'}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default ReplyForm;
