"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { ContextSnapshot } from '../hooks/useAgentState';
import { computeDiff } from '../utils/diff';

interface ContextInspectorProps {
  snapshots: ContextSnapshot[];
}

export function ContextInspector({ snapshots }: ContextInspectorProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({ '$': true });

  
  const snapshotsByCtx = useMemo(() => {
    const map = new Map<string, ContextSnapshot[]>();
    for (const snap of snapshots) {
      const list = map.get(snap.context_id) || [];
      list.push(snap);
      map.set(snap.context_id, list);
    }
    return map;
  }, [snapshots]);

  const contextIds = useMemo(() => Array.from(snapshotsByCtx.keys()), [snapshotsByCtx]);
  const [selectedCtxId, setSelectedCtxId] = useState<string>('');

  
  React.useEffect(() => {
    if (contextIds.length > 0 && !selectedCtxId) {
      setTimeout(() => setSelectedCtxId(contextIds[0]), 0);
    }
  }, [contextIds, selectedCtxId]);

  const activeSnapshots = selectedCtxId ? (snapshotsByCtx.get(selectedCtxId) || []) : [];
  const currentSnap = activeSnapshots[selectedIdx];
  const prevSnap = selectedIdx > 0 ? activeSnapshots[selectedIdx - 1] : null;

  
  const diffEntries = useMemo(() => {
    if (!currentSnap) return [];
    if (!prevSnap) {
      return flattenObject(currentSnap.data, '$').map(e => ({ ...e, diffType: 'none' as const }));
    }
    const diffTree = computeDiff(prevSnap.data, currentSnap.data);
    return flattenDiffNode(diffTree, '$', 0);
  }, [currentSnap, prevSnap]);

  const togglePath = useCallback((path: string) => {
    setExpandedPaths(prev => ({ ...prev, [path]: !prev[path] }));
  }, []);

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <div className="w-12 h-12 flex items-center justify-center text-xl bg-[var(--color-main)] border-2 border-black" style={{ boxShadow: 'var(--shadow-flat-sm)' }}>
          🔍
        </div>
        <p className="nb-mono text-[0.7rem] font-bold uppercase text-[var(--color-muted-text)]">
          Waiting for CONTEXT_SNAPSHOT events…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {}
      <div className="px-2 py-2 border-b-2 border-black bg-white flex flex-col gap-2">
        {}
        {contextIds.length > 1 && (
          <select
            className="nb-input text-[0.65rem] py-1"
            value={selectedCtxId}
            onChange={e => { setSelectedCtxId(e.target.value); setSelectedIdx(0); }}
          >
            {contextIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        )}

        {}
        <div className="flex items-center justify-between gap-1">
          <button
            className="nb-btn text-[0.55rem] py-0.5 px-2"
            disabled={selectedIdx <= 0}
            onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
          >
            ‹ PREV
          </button>
          <span className="nb-mono text-[0.6rem] font-bold text-[var(--color-muted-text)]">
            {selectedIdx + 1} / {activeSnapshots.length}
          </span>
          <button
            className="nb-btn text-[0.55rem] py-0.5 px-2"
            disabled={selectedIdx >= activeSnapshots.length - 1}
            onClick={() => setSelectedIdx(i => Math.min(activeSnapshots.length - 1, i + 1))}
          >
            NEXT ›
          </button>
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {diffEntries.map((entry) => {
          const isExpandable = entry.isObject || entry.isArray;
          const isExpanded = expandedPaths[entry.path] ?? (entry.depth < 2);
          const indent = entry.depth * 12;

          
          let diffBg = '';
          let diffBadge: string | null = null;
          if (entry.diffType === 'added') { diffBg = 'bg-[var(--color-accent-green)]/15'; diffBadge = '+NEW'; }
          if (entry.diffType === 'removed') { diffBg = 'bg-[var(--color-accent-red)]/15'; diffBadge = 'DEL'; }
          if (entry.diffType === 'modified') { diffBg = 'bg-[var(--color-accent-amber)]/15'; diffBadge = 'CHG'; }

          return (
            <div
              key={entry.path}
              className={`flex items-center gap-1.5 py-0.5 px-1 text-[0.6rem] rounded-sm cursor-default ${diffBg} hover:bg-black/5`}
              style={{ paddingLeft: `${indent + 4}px` }}
            >
              {}
              {isExpandable ? (
                <button
                  className="w-3 h-3 flex items-center justify-center text-[0.5rem] shrink-0"
                  onClick={() => togglePath(entry.path)}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              ) : (
                <span className="w-3 shrink-0" />
              )}

              {}
              <span className="nb-mono font-bold text-[var(--color-fg)] shrink-0">{entry.key}:</span>

              {}
              {!isExpandable && (
                <span className="nb-mono text-[var(--color-secondary-text)] truncate">
                  {typeof entry.value === 'string' ? `"${entry.value}"` : String(entry.value)}
                </span>
              )}

              {}
              {isExpandable && (
                <span className="nb-mono text-[var(--color-muted-text)]">
                  {entry.isArray ? `[${entry.childCount}]` : `{${entry.childCount}}`}
                </span>
              )}

              {}
              {diffBadge && (
                <span className={`nb-badge py-0 text-[0.45rem] ml-auto ${
                  entry.diffType === 'added' ? 'bg-[var(--color-accent-green)]' :
                  entry.diffType === 'removed' ? 'bg-[var(--color-accent-red)]' :
                  'bg-[var(--color-accent-amber)]'
                }`}>
                  {diffBadge}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


interface TreeEntry {
  key: string;
  value: unknown;
  path: string;
  depth: number;
  isObject: boolean;
  isArray: boolean;
  childCount: number;
}

function flattenObject(obj: unknown, prefix: string, depth: number = 0): (TreeEntry & { diffType: 'none' | 'added' | 'removed' | 'modified' })[] {
  const entries: (TreeEntry & { diffType: 'none' | 'added' | 'removed' | 'modified' })[] = [];
  if (obj && typeof obj === 'object') {
    
    const keys = Object.keys(obj);
    for (const key of keys) {
      const val = (obj as Record<string, unknown>)[key];
      const path = `${prefix}.${key}`;
      const isChildObj = val && typeof val === 'object';
      entries.push({
        key,
        value: val,
        path,
        depth,
        isObject: isChildObj ? !Array.isArray(val) : false,
        isArray: isChildObj ? Array.isArray(val) : false,
        childCount: isChildObj ? Object.keys(val as object).length : 0,
        diffType: 'none',
      });
      if (isChildObj) {
        entries.push(...flattenObject(val, path, depth + 1));
      }
    }
  }
  return entries;
}

import { DiffNode } from '../utils/diff';

function flattenDiffNode(node: DiffNode, prefix: string, depth: number = 0): (TreeEntry & { diffType: 'none' | 'added' | 'removed' | 'modified' })[] {
  const entries: (TreeEntry & { diffType: 'none' | 'added' | 'removed' | 'modified' })[] = [];
  
  if (!node.children || node.children.length === 0) {
    return entries;
  }

  for (const child of node.children) {
    const path = `${prefix}.${child.key}`;
    const val = child.status === 'removed' ? child.oldValue : child.newValue;
    const isChildObj = val !== null && typeof val === 'object';
    
    entries.push({
      key: child.key,
      value: val,
      path,
      depth,
      isObject: isChildObj ? !Array.isArray(val) : false,
      isArray: isChildObj ? Array.isArray(val) : false,
      childCount: isChildObj ? Object.keys(val as object).length : 0,
      diffType: child.status === 'unchanged' ? 'none' : child.status === 'added' ? 'added' : child.status === 'removed' ? 'removed' : 'modified',
    });

    if (child.children && child.children.length > 0) {
      entries.push(...flattenDiffNode(child, path, depth + 1));
    } else if (isChildObj && child.status !== 'removed') {
      
      entries.push(...flattenObject(val, path, depth + 1).map(e => ({ ...e, diffType: child.status === 'unchanged' ? 'none' : child.status === 'added' ? 'added' : child.status === 'removed' ? 'removed' : 'modified' } as const)));
    }
  }
  return entries;
}
