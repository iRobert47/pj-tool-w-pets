// 讀資料的 hook：資料變動（CHANGED 事件）或回到畫面時自動重讀
import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { CHANGED } from './api';

export function useData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;

  const reload = useCallback(async () => {
    try {
      setError(null);
      setData(await loadRef.current());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, deps);
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(CHANGED, reload);
    return () => sub.remove();
  }, [reload]);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  return { data, error, loading, reload, setData };
}
