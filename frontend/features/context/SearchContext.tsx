import React, {createContext, useState, useContext, ReactNode} from 'react';
import axios from 'axios';
import {API_URL} from '@env';

type ResultType = {
  _id: string;
  name?: string;
  email?: string;
  title?: string;
  type: 'user' | 'group';
};

type SearchContextType = {
  query: string;
  setQuery: (query: string) => void;
  selectedType: 'user' | 'group' | null;
  setSelectedType: (type: 'user' | 'group' | null) => void;
  results: ResultType[];
  search: () => Promise<void>;
  loading: boolean;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

type SearchProviderProps = {
  children: ReactNode;
};

export const SearchProvider = ({children}: SearchProviderProps) => {
  const [query, setQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<any>(null);
  const [results, setResults] = useState<ResultType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const search = async () => {

    if (!query.trim()) return;
    setLoading(true);
    try {
      const trimmed = query.replace(/\s+/g, '');
      console.log(trimmed)
      const response = await axios.get<{results: ResultType[]}>(
        `http://192.168.84.68:8000/api/global/search`,
        {
          params: {
            trimmed,
            type: selectedType,
          },
        },
      );
      console.log(response);
      setResults(response.data.results);
    } catch (error) {
      console.error('Search error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        selectedType,
        setSelectedType,
        results,
        search,
        loading,
      }}>
      {children}
    </SearchContext.Provider>
  );
};
