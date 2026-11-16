/**
 * useAuth.jsx — Backward-compatible re-export shim.
 *
 * The canonical AuthContext now lives in context/AuthContext.jsx
 * (per TRD Section 2.2 Component Architecture).
 * All existing imports of { AuthProvider, useAuth } from './hooks/useAuth'
 * continue to work without any changes across the rest of the codebase.
 */
export { AuthProvider, useAuth, AuthContext } from '../context/AuthContext';
