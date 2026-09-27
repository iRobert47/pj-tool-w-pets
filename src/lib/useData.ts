// 讀資料的 hook：資料變動（CHANGED 事件）或回到畫面時自動重讀
import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { CHANGED } from './api';

// 畫面之間共用的快取：切換分頁時先顯示上次的資料，背景再更新（不會閃白、不會等）
const cache = new Map<string, unknown>();

export function useData<T>(load: () => Promise<T>, deps: unknown[] = [], cacheKey?: string) {
  const key = cacheKey ? cacheKey + ':' + JSON.stringify(deps) : null;
  const [data, setDataState] = useState<T | null>(() => (key && cache.has(key) ? (cache.get(key) as T) : null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!(key && cache.has(key)));
  const keyRef = useRef(key);
  keyRef.current = key;
  const setData = useCallback((v: T | null | ((prev: T | null) => T | null)) => {
    setDataState((prev) => {
      const next = typeof v === 'function' ? (v as (p: T | null) => T | null)(prev) : v;
      if (keyRef.current && next != null) cache.set(keyRef.current, next);
      return next;
    });
  }, []);
  const loadRef = useRef(load);
  loadRef.current = load;

  const reload = useCallback(async () => {
    try {
      setError(null);
      const v = await loadRef.current();
      setData(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const mounted = useRef(false);
  // deps 變了才重讀（第一次由 useFocusEffect 負責，避免同時讀兩次）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (mounted.current) reload(); mounted.current = true; }, deps);
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(CHANGED, reload);
    return () => sub.remove();
  }, [reload]);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  return { data, error, loading, reload, setData };
}
