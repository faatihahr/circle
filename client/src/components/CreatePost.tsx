import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import { useCreatePost } from '../hooks/useCreatePost';

const CreatePost: React.FC = () => {
  const { user } = useAuth();
  const { createPost, loading } = useCreatePost();
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
    const newPost = await createPost({ content, image: image || undefined });
    if (newPost) {
      setContent('');
      setImage(null);
      setExpanded(false);
      // Posts will be updated in real-time via WebSocket
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
    <Card ref={cardRef} className="mb-4 bg-card-post cursor-pointer border-2 border-white hover:shadow-xl transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar>
            <AvatarImage
              src={user?.profilePicture ? `http://localhost:3000${user.profilePicture}` : undefined}
              alt={user?.username}
            />
            <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setExpanded(true)}
                onClick={() => setExpanded(true)}
                placeholder="What's on your mind?"
                className="w-full p-2 text-sm bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground rounded-lg transition-all duration-200"
                rows={expanded ? 3 : 1}
                style={{ minHeight: expanded ? '80px' : '40px' }}
              />
              {expanded && (
                <>
                  {image && (
                    <div className="relative mt-2">
                      <img
                        src={URL.createObjectURL(image)}
                        alt="Preview"
                        className="max-w-full h-auto rounded-xl max-h-64 object-cover"
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
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="image-upload" className="cursor-pointer text-primary hover:text-primary/80">
                        📎 Attach image
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                    <Button type="submit" disabled={loading || !content.trim()}>
                      {loading ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
