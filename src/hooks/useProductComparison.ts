import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const MAX_COMPARE_ITEMS = 4;
const STORAGE_KEY = 'compareProducts';

export function useProductComparison() {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    loadFromStorage();
  }, []);

  const loadFromStorage = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCompareIds(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const saveToStorage = (ids: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  };

  const addToCompare = (productId: string) => {
    if (compareIds.includes(productId)) {
      toast.info('Produto já está na comparação');
      return false;
    }

    if (compareIds.length >= MAX_COMPARE_ITEMS) {
      toast.error(`Você pode comparar no máximo ${MAX_COMPARE_ITEMS} produtos`);
      return false;
    }

    const updated = [...compareIds, productId];
    setCompareIds(updated);
    saveToStorage(updated);
    toast.success('Produto adicionado à comparação!');
    return true;
  };

  const removeFromCompare = (productId: string) => {
    const updated = compareIds.filter(id => id !== productId);
    setCompareIds(updated);
    saveToStorage(updated);
    toast.success('Produto removido da comparação');
  };

  const clearCompare = () => {
    setCompareIds([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Comparação limpa');
  };

  const isInCompare = (productId: string) => compareIds.includes(productId);

  return {
    compareIds,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    count: compareIds.length,
  };
}
