import React from 'react';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

const PostCardSkeleton: React.FC = () => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 mb-2" />
            <Skeleton className="h-4 w-3/4 mb-3" />
            <Skeleton className="w-full aspect-4/5 rounded mb-3" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCardSkeleton;
