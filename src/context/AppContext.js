import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import {
  initStore, getProducts, getSales, getSettings, getDashboardStats
} from '../utils/store';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true); // data loading (once signed in)
  const [error, setError] = useState(null);     // last load/refresh error, if any

  // Auth: one shared shop account for all tills.
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false); // has the initial session check finished?

  // Reloads everything from the store. Async (the store calls hit Supabase),
  // so this returns a Promise callers can await after a write. Errors are
  // caught and surfaced via `error` rather than thrown.
  const refresh = useCallback(async () => {
    try {
      const [p, s, sett, st] = await Promise.all([
        getProducts(),
        getSales(),
        getSettings(),
        getDashboardStats(),
      ]);
      setProducts(p);
      setSales(s);
      setSettings(sett);
      setStats(st);
      setError(null);
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[AppContext] refresh failed:', e);
      setError(e?.message || 'Failed to load data from the server.');
      return false;
    }
  }, []);

  // Track the auth session: read the persisted one on boot, then subscribe.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Data only loads once a session exists — RLS returns nothing without it.
  // On sign-out, clear everything so no stale data lingers on the till.
  useEffect(() => {
    if (!session) {
      setProducts([]);
      setSales([]);
      setSettings({});
      setStats({});
      setError(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      await initStore();   // connectivity check; never throws
      await refresh();
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [session, refresh]);

  // Email + password against the shared shop account. Returns an error message
  // (string) on failure, or null on success.
  const signIn = async (email, password) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    return signInError ? (signInError.message || 'Sign in failed.') : null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange fires -> session becomes null -> data clears.
  };

  const currentUser = { name: session?.user?.email || 'Optimus Sphere' };

  return (
    <AppContext.Provider value={{
      products, sales, settings, stats,
      currentUser, refresh, loading, error,
      session, authReady, signIn, signOut,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
