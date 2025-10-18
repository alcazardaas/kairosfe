import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

interface Option {
  id: string;
  name: string;
  code?: string;
}

interface AsyncComboboxProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => Promise<Option[]>;
  error?: string;
  disabled?: boolean;
  debounceMs?: number;
}

export default function AsyncCombobox({
  label,
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
  error,
  disabled = false,
  debounceMs = 300,
}: AsyncComboboxProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [cache, setCache] = useState<Map<string, Option[]>>(new Map());

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load initial options when opened
  useEffect(() => {
    if (isOpen && options.length === 0 && query === '') {
      loadOptions('');
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (isOpen) {
      debounceTimerRef.current = setTimeout(() => {
        loadOptions(query);
      }, debounceMs);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, isOpen]);

  const loadOptions = async (searchQuery: string) => {
    const cacheKey = searchQuery.toLowerCase();

    // Check cache first
    if (cache.has(cacheKey)) {
      setOptions(cache.get(cacheKey)!);
      return;
    }

    try {
      setLoading(true);
      const results = await onSearch(searchQuery);
      setOptions(results);

      // Cache results
      setCache((prev) => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, results);
        // Keep only last 10 searches in cache
        if (newCache.size > 10) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        return newCache;
      });
    } catch (error) {
      console.error('Failed to load options:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    onChange(option.id);
    setQuery(option.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedOption(null);
    onChange('');
    setQuery('');
    setOptions([]);
  };

  const displayValue = selectedOption ? selectedOption.name : query;

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedOption) {
              setSelectedOption(null);
              onChange('');
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 pr-10 border rounded-md
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          `}
        />

        {/* Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <span className="material-symbols-outlined text-gray-400 text-sm">close</span>
            </button>
          )}
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <span className="material-symbols-outlined text-gray-400 text-sm">
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              {t('common.loading')}
            </div>
          ) : options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              {query ? t('common.noResults') : t('common.typeToSearch')}
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                className={`
                  w-full text-left px-4 py-2 text-sm
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  transition-colors
                  ${selectedOption?.id === option.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {option.name}
                </div>
                {option.code && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {option.code}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
