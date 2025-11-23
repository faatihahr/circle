import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export default function SearchBar({
  className,
  placeholder = "Cari users, posts...",
  onSearch
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceTimer = useRef<number | null>(null);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      } else {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Debounced search for instant search (optional)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      // You can implement instant suggestions here if needed
      // For now, we'll just log the query
      if (query && onSearch) {
        // handleSearch(query); // Uncomment for instant search
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, onSearch]);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-10 transition-all duration-200',
            isFocused && 'ring-2 ring-primary/20'
          )}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
