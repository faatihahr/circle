import { useState, useEffect } from 'react';
import { Search, Users, MessageSquare, Loader2 } from 'lucide-react';
import SearchBar from './SearchBar';
import { searchAPI } from '../lib/api';
import type { Thread } from '../lib/types';
import type { SearchUser } from '../stores/postsSlice';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '../lib/utils';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import {
  setSearchQuery,
  setSearchTab,
  setSearchResults,
  setSearchLoading,
  setSearchMode
} from '../stores/postsSlice';

type SearchTab = 'all' | 'users' | 'posts';

export default function SearchView() {
  const dispatch = useAppDispatch();
  const {
    searchQuery,
    searchTab,
    searchResults,
    searchLoading
  } = useAppSelector((state) => state.posts);

  const [activeTab, setActiveTab] = useState<SearchTab>(searchTab);

  // Load search results when query changes
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const loadSearchResults = async () => {
      dispatch(setSearchLoading(true));
      try {
        if (activeTab === 'all') {
          const response = await searchAPI.searchAll(searchQuery);
          dispatch(setSearchResults({
            users: response.data.users || [],
            threads: response.data.threads || []
          }));
        } else if (activeTab === 'users') {
          const response = await searchAPI.searchUsers(searchQuery);
          dispatch(setSearchResults({
            users: response.data.users || [],
            threads: []
          }));
        } else if (activeTab === 'posts') {
          const response = await searchAPI.searchPosts(searchQuery);
          dispatch(setSearchResults({
            users: [],
            threads: response.data.threads || []
          }));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        dispatch(setSearchLoading(false));
      }
    };

    loadSearchResults();
  }, [searchQuery, activeTab, dispatch]);

  // Handle search from SearchBar
  const handleSearch = (newQuery: string) => {
    dispatch(setSearchQuery(newQuery));
    setActiveTab('all');
    dispatch(setSearchTab('all'));
  };

  // Handle tab change
  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    dispatch(setSearchTab(tab));
    if (searchQuery) {
      // Refresh results for the new tab
      loadSearchResultsForTab(tab);
    }
  };

  const loadSearchResultsForTab = async (tab: SearchTab) => {
    dispatch(setSearchLoading(true));
    try {
      if (tab === 'all') {
        const response = await searchAPI.searchAll(searchQuery);
        dispatch(setSearchResults({
          users: response.data.users || [],
          threads: response.data.threads || []
        }));
      } else if (tab === 'users') {
        const response = await searchAPI.searchUsers(searchQuery);
        dispatch(setSearchResults({
          users: response.data.users || [],
          threads: []
        }));
      } else if (tab === 'posts') {
        const response = await searchAPI.searchPosts(searchQuery);
        dispatch(setSearchResults({
          users: [],
          threads: response.data.threads || []
        }));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      dispatch(setSearchLoading(false));
    }
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
    <div className="space-y-8">
      {/* Users section - preview 4 users */}
      {searchResults.users.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Users</h2>
            </div>
            {searchResults.users.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTabChange('users')}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                See All Users ({searchResults.users.length})
              </Button>
            )}
          </div>
          <div className="flex gap-6">
            {searchResults.users.slice(0, 4).map(user => (
              <div
                key={user.id}
                className="text-center cursor-pointer hover:scale-105 transition-transform flex-1 max-w-[120px]"
                onClick={() => window.location.href = `/profile/${user.id}`}
              >
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage src={user.profilePicture || undefined} />
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium truncate">
                  {user.name || user.username}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  @{user.username}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts section - preview 6 posts in grid */}
      {searchResults.threads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Posts</h2>
            </div>
            {searchResults.threads.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTabChange('posts')}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                See All Posts ({searchResults.threads.length})
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {searchResults.threads.slice(0, 6).map(post => (
              <div
                key={post.id}
                className="cursor-pointer group"
                onClick={() => window.location.href = `/thread/${post.id}`}
              >
                {post.image ? (
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={`http://localhost:3000${post.image}`}
                      alt="Post image"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center p-4">
                    <div className="text-center">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.reply}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchResults.users.length === 0 && searchResults.threads.length === 0 && !searchLoading && renderEmptyState()}
    </div>
  );

  const tabs = [
    { id: 'all', label: 'Semua', icon: Search },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'posts', label: 'Posts', icon: MessageSquare },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div onClick={() => dispatch(setSearchMode(false))} className="cursor-pointer text-xl text-foreground hover:text-foreground">
        ← Back to home
      </div>

      {/* Search Bar */}
      <div>
        <SearchBar
          onSearch={handleSearch}
          className="max-w-md"
          placeholder="Cari users, posts..."
        />
      </div>

      {/* Search Query */}
      {searchQuery && (
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Hasil pencarian untuk "{searchQuery}"
          </h1>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            onClick={() => handleTabChange(id)}
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
      {searchLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Mencari...</span>
        </div>
      )}

      {/* Results */}
      {!searchLoading && (
        <>
          {activeTab === 'all' && renderAllResults()}

          {activeTab === 'users' && (
            <div>
              {searchResults.users.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.users.map(renderUserCard)}
                </div>
              ) : renderEmptyState()}
            </div>
          )}

          {activeTab === 'posts' && (
            <div>
              {searchResults.threads.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.threads.map(renderPostCard)}
                </div>
              ) : renderEmptyState()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
