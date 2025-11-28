'use client';

/**
 * Global Search Component
 * Advanced search with filters and multi-entity support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  X,
  Filter,
  SlidersHorizontal,
  Loader2,
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  Bell,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { debounce } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'student' | 'teacher' | 'parent' | 'class' | 'subject' | 'homework' | 'announcement';
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface GlobalSearchProps {
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
  entityTypes?: SearchResult['type'][];
  className?: string;
}

const ENTITY_ICONS = {
  student: Users,
  teacher: GraduationCap,
  parent: Users,
  class: BookOpen,
  subject: BookOpen,
  homework: FileText,
  announcement: Bell,
};

export function GlobalSearch({
  onResultClick,
  placeholder,
  showFilters = true,
  entityTypes = ['student', 'teacher', 'parent', 'class', 'subject', 'homework', 'announcement'],
  className,
}: GlobalSearchProps) {
  const t = useTranslations();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedType, setSelectedType] = useState<SearchResult['type'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Mock search function - replace with actual API call
  const performSearch = useCallback(
    async (searchQuery: string, type: SearchResult['type'] | 'all') => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'student',
          title: 'Ahmed Mohammed',
          subtitle: 'Grade 10-A | ID: STU001',
          description: 'Average: 85%',
        },
        {
          id: '2',
          type: 'teacher',
          title: 'Sarah Johnson',
          subtitle: 'Mathematics Teacher',
          description: '5 Classes',
        },
        {
          id: '3',
          type: 'class',
          title: 'Grade 10-A',
          subtitle: '25 Students',
          description: 'Room 101',
        },
        {
          id: '4',
          type: 'homework',
          title: 'Math Chapter 5 Exercises',
          subtitle: 'Due: Tomorrow',
          description: 'Grade 10-A',
        },
        {
          id: '5',
          type: 'announcement',
          title: 'School Holiday Notice',
          subtitle: 'Posted 2 days ago',
          description: 'Important announcement for all students',
        },
      ];

      // Filter by type
      const filtered =
        type === 'all'
          ? mockResults
          : mockResults.filter((r) => r.type === type);

      // Filter by entity types
      const finalResults = filtered.filter((r) =>
        entityTypes.includes(r.type)
      );

      setResults(finalResults);
      setIsSearching(false);
    },
    [entityTypes]
  );

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string, type: SearchResult['type'] | 'all') => {
      performSearch(query, type);
    }, 300),
    [performSearch]
  );

  useEffect(() => {
    if (query) {
      debouncedSearch(query, selectedType);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query, selectedType, debouncedSearch]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery('');
    if (onResultClick) {
      onResultClick(result);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const getEntityLabel = (type: SearchResult['type']) => {
    const labels = {
      student: t('phase5.search.students'),
      teacher: t('phase5.search.teachers'),
      parent: t('phase5.search.parents'),
      class: t('phase5.search.classes'),
      subject: t('phase5.search.subjects'),
      homework: t('phase5.search.homework'),
      announcement: t('phase5.search.announcements'),
    };
    return labels[type];
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder || t('phase5.search.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Select
            value={selectedType}
            onValueChange={(value) =>
              setSelectedType(value as SearchResult['type'] | 'all')
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('phase5.search.searchIn')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getEntityLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('phase5.search.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">
                {t('phase5.search.relevance')}
              </SelectItem>
              <SelectItem value="date">
                {t('phase5.search.dateModified')}
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('phase5.search.advancedSearch')}
          </Button>

          {(selectedType !== 'all' || sortBy !== 'relevance') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedType('all');
                setSortBy('relevance');
              }}
            >
              {t('phase5.search.clearFilters')}
            </Button>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <Card className="mt-2 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('common.date')}
              </label>
              <Input type="date" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('common.status')}
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button size="sm">{t('phase5.search.applyFilters')}</Button>
          </div>
        </Card>
      )}

      {/* Search Results */}
      {showResults && (
        <Card className="absolute top-full z-50 mt-2 w-full overflow-hidden shadow-lg">
          {results.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto">
              <div className="p-2 text-sm text-muted-foreground">
                {t('phase5.search.showingResults', { count: results.length })}
              </div>
              <div className="divide-y">
                {results.map((result) => {
                  const Icon = ENTITY_ICONS[result.type];
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full p-4 text-left transition-colors hover:bg-muted"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">
                              {result.title}
                            </h4>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              {getEntityLabel(result.type)}
                            </span>
                          </div>
                          {result.subtitle && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {result.subtitle}
                            </p>
                          )}
                          {result.description && (
                            <p className="mt-1 text-xs text-muted-foreground truncate">
                              {result.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : query && !isSearching ? (
            <div className="p-8 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-medium">
                {t('phase5.search.noResults')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}

