import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users, MessageSquare, Loader2 } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { searchAPI } from '../lib/api';
import type { SearchUser, Thread } from '../lib/types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { cn } from '../lib/utils';

type SearchTab = 'all' | 'users' | 'posts';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(query);

  // Search results
  const [allResults, setAllResults] = useState<{
    users: SearchUser[];
    threads: Thread[];
  }>({ users: [], threads: [] });

  const [userResults, setUserResults] = useState<SearchUser[]>([]);
  const [postResults, setPostResults] = useState<Thread[]>([]);

  // Load search results when query changes
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const loadSearchResults = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'all') {
          const response = await searchAPI.searchAll(searchQuery);
          setAllResults({
            users: response.data.users || [],
            threads: response.data.threads || []
          });
        } else if (activeTab === 'users') {
          const response = await searchAPI.searchUsers(searchQuery);
          setUserResults(response.data.users || []);
        } else if (activeTab === 'posts') {
          const response = await searchAPI.searchPosts(searchQuery);
          setPostResults(response.data.threads || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSearchResults();
  }, [searchQuery, activeTab]);

  // Handle search from SearchBar
  const handleSearch = (newQuery: string) => {
    setSearchQuery(newQuery);
    setSearchParams({ q: newQuery });
  };

  const renderUserCard = (user: SearchUser) => (
    <Card key={user.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profilePicture || undefined} />
            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm">{user.name || user.username}</h3>
              <span className="text-muted-foreground text-sm">@{user.username}</span>
            </div>
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <div className="text-xs text-muted-foreground">
                {user.followersCount} followers
              </div>
              <div className="text-xs text-muted-foreground">
                {user.followingCount} following
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPostCard = (post: Thread) => (
    <Card key={post.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Author info */}
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.user.profile_picture || undefined} />
              <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{post.user.name || post.user.username}</p>
              <p className="text-xs text-muted-foreground">@{post.user.username}</p>
            </div>
          </div>

          {/* Content */}
          <p className="text-sm line-clamp-3">{post.content}</p>

          {/* Image */}
          {post.image && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={`http://localhost:3000${post.image}`}
                alt="Post image"
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-3 w-3" />
              <span>{post.reply}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>❤️</span>
              <span>{post.likes}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-medium">Tidak ada hasil ditemukan</h3>
      <p className="text-muted-foreground mt-2">
        Coba kata kunci yang berbeda atau periksa ejaan Anda.
      </p>
    </div>
  );

  const renderAllResults = () => (
    <div className="space-y-6">
      {/* Users section */}
      {allResults.users.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Users ({allResults.users.length})</h2>
          </div>
          <div className="space-y-2">
            {allResults.users.map(renderUserCard)}
          </div>
        </div>
      )}

      {/* Posts section */}
      {allResults.threads.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Posts ({allResults.threads.length})</h2>
          </div>
          <div className="space-y-2">
            {allResults.threads.map(renderPostCard)}
          </div>
        </div>
      )}

      {allResults.users.length === 0 && allResults.threads.length === 0 && !isLoading && renderEmptyState()}
    </div>
  );

  const tabs = [
    { id: 'all', label: 'Semua', icon: Search },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'posts', label: 'Posts', icon: MessageSquare },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          onSearch={handleSearch}
          className="max-w-md mx-auto"
          placeholder="Cari users, posts..."
        />
      </div>

      {/* Search Query */}
      {searchQuery && (
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">
            Hasil pencarian untuk "{searchQuery}"
          </h1>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center space-x-2 px-6 py-3 rounded-none border-b-2 border-transparent hover:bg-muted/50',
              activeTab === id && 'border-primary text-primary'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Mencari...</span>
        </div>
      )}

      {/* Results */}
      {!isLoading && (
        <>
          {activeTab === 'all' && renderAllResults()}

          {activeTab === 'users' && (
            <div>
              {userResults.length > 0 ? (
                <div className="space-y-2">
                  {userResults.map(renderUserCard)}
                </div>
              ) : renderEmptyState()}
            </div>
          )}

          {activeTab === 'posts' && (
            <div>
              {postResults.length > 0 ? (
                <div className="space-y-2">
                  {postResults.map(renderPostCard)}
                </div>
              ) : renderEmptyState()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
