import { create } from 'zustand';
import type { ApiOperation, ParsedSchema } from '@/models/types';

interface AppState {
  schema: ParsedSchema | null;
  operations: ApiOperation[];
  filteredOperations: ApiOperation[];
  selectedOperation: ApiOperation | null;
  searchQuery: string;
  selectedTag: string | null;
  selectedMethod: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSchema: (schema: ParsedSchema | null) => void;
  setOperations: (operations: ApiOperation[]) => void;
  setFilteredOperations: (operations: ApiOperation[]) => void;
  selectOperation: (operation: ApiOperation | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  setSelectedMethod: (method: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  schema: null,
  operations: [],
  filteredOperations: [],
  selectedOperation: null,
  searchQuery: '',
  selectedTag: null,
  selectedMethod: null,
  isLoading: false,
  error: null,

  setSchema: (schema) => set({ schema }),
  setOperations: (operations) => set({ operations }),
  setFilteredOperations: (filteredOperations) => set({ filteredOperations }),
  selectOperation: (selectedOperation) => set({ selectedOperation }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedTag: (selectedTag) => set({ selectedTag }),
  setSelectedMethod: (selectedMethod) => set({ selectedMethod }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
