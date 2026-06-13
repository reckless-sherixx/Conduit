"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TimelineEvent } from '../hooks/useAgentState';

interface TraceTimelineProps {
  events: TimelineEvent[];
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  TOKEN: 'var(--color-accent-blue)',
  TOOL_CALL: 'var(--color-accent-purple)',
  TOOL_RESULT: 'var(--color-accent-green)',
  CONTEXT_SNAPSHOT: 'var(--color-main)',
  PING: 'var(--color-accent-amber)',
  ERROR: 'var(--color-accent-red)',
  STATUS: 'var(--color-accent-orange)',
};

const FILTER_OPTIONS = ['ALL', 'TOKEN', 'TOOL_CALL', 'TOOL_RESULT', 'CONTEXT', 'PING', 'ERROR'];

export function TraceTimeline({ events }: TraceTimelineProps) {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  
  const groupedEvents = useMemo(() => {
    const groups: { type: 'single' | 'token_group'; events: TimelineEvent[]; label: string }[] = [];
    let tokenGroup: TimelineEvent[] = [];
    let lastStreamId: string | null = null;

    const flushGroup = () => {
      if (tokenGroup.length > 0) {
        const totalText = tokenGroup.reduce((acc, e) => acc + (e.data?.text || ''), '');
        groups.push({
          type: 'token_group',
          events: [...tokenGroup],
          label: `Streamed ${tokenGroup.length} tokens: "${totalText.slice(0, 30)}${totalText.length > 30 ? '…' : ''}"`,
        });
        tokenGroup = [];
        lastStreamId = null;
      }
    };

    for (const evt of events) {
      if (evt.type === 'TOKEN') {
        const sid = evt.data?.stream_id || '';
        if (lastStreamId && sid !== lastStreamId) flushGroup();
        tokenGroup.push(evt);
        lastStreamId = sid;
      } else {
        flushGroup();
        groups.push({ type: 'single', events: [evt], label: '' });
      }
    }
    flushGroup();
    return groups;
  }, [events]);

  
  const filtered = useMemo(() => {
    return groupedEvents.filter(g => {
      const evtType = g.events[0].type;
      if (filterType !== 'ALL') {
        if (filterType === 'CONTEXT' && evtType !== 'CONTEXT_SNAPSHOT') return false;
        if (filterType !== 'CONTEXT' && evtType !== filterType) return false;
      }
      if (searchQuery) {
        const text = JSON.stringify(g.events).toLowerCase();
        if (!text.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [groupedEvents, filterType, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {}
      <div className="px-2 py-2 border-b-2 border-black bg-white flex flex-col gap-2">
        <input
          type="text"
          className="nb-input text-[0.7rem]"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search events..."
        />
        <div className="flex flex-wrap gap-1">
          {FILTER_OPTIONS.map(f => (
            <button
              key={f}
              className={`nb-btn text-[0.55rem] py-0.5 px-2 ${filterType === f ? 'bg-[var(--color-main)] text-[var(--color-main-foreground)]' : ''}`}
              onClick={() => setFilterType(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1.5">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <p className="text-[0.7rem] text-[var(--color-muted-text)] font-bold uppercase">
              {events.length === 0 ? 'Waiting for events…' : 'No matching events'}
            </p>
          </div>
        ) : (
          filtered.map((group, gi) => {
            const mainEvent = group.events[0];
            const evtColor = EVENT_TYPE_COLORS[mainEvent.type] || 'var(--color-muted-text)';

            if (group.type === 'token_group') {
              return (
                <TokenGroupRow
                  key={`tg-${gi}`}
                  group={group}
                  color={evtColor}
                />
              );
            }

            return (
              <div
                key={mainEvent.id}
                className="flex items-start gap-2 p-1.5 border-2 border-black bg-white text-[0.65rem] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0_0_#000] transition-all cursor-default"
              >
                {}
                <div className="w-2.5 h-2.5 rounded-full border border-black shrink-0 mt-0.5" style={{ backgroundColor: evtColor }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="nb-mono font-extrabold text-[0.6rem] text-[var(--color-muted-text)]">
                      #{mainEvent.seqs[0]}
                    </span>
                    <span
                      className="nb-badge py-0 text-[0.5rem]"
                      style={{ background: evtColor, color: '#000' }}
                    >
                      {mainEvent.type}
                    </span>
                  </div>
                  <div className="nb-mono text-[0.6rem] text-[var(--color-secondary-text)] mt-0.5 truncate">
                    {getEventSummary(mainEvent)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}


function TokenGroupRow({ group, color }: { group: { events: TimelineEvent[]; label: string }; color: string }) {
  const [expanded, setExpanded] = useState(false);
  const firstSeq = group.events[0].seqs[0];
  const lastSeq = group.events[group.events.length - 1].seqs[0];

  return (
    <div className="border-2 border-black bg-white overflow-hidden">
      <button
        className="flex items-center gap-2 w-full px-2 py-1.5 text-left hover:bg-[var(--color-secondary-bg)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-2.5 h-2.5 rounded-full border border-black shrink-0" style={{ backgroundColor: color }} />
        <span className="nb-mono font-extrabold text-[0.6rem] text-[var(--color-muted-text)]">
          #{firstSeq}–{lastSeq}
        </span>
        <span className="nb-badge py-0 text-[0.5rem]" style={{ background: color, color: '#000' }}>
          TOKEN ×{group.events.length}
        </span>
        <span className="text-[0.6rem] text-[var(--color-secondary-text)] truncate flex-1">{group.label}</span>
        <span className="text-[0.6rem] shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="border-t-2 border-black px-2 py-1 bg-[var(--color-secondary-bg)] max-h-32 overflow-y-auto">
          {group.events.map((evt) => (
            <div key={evt.id} className="flex items-center gap-1 py-0.5 text-[0.6rem]">
              <span className="nb-mono font-bold text-[var(--color-muted-text)]">#{evt.seqs[0]}</span>
              <span className="nb-mono text-[var(--color-fg)]">{JSON.stringify(evt.data?.text)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getEventSummary(evt: TimelineEvent): string {
  switch (evt.type) {
    case 'TOKEN': return evt.data?.text || '';
    case 'TOOL_CALL': return `${evt.data?.tool_name || 'tool'}(…)`;
    case 'TOOL_RESULT': return `result → ${evt.data?.call_id || ''}`;
    case 'CONTEXT_SNAPSHOT': return `ctx: ${evt.data?.context_id || ''}`;
    case 'PING': return 'heartbeat';
    case 'ERROR': return evt.data?.message || 'error';
    default: return evt.type;
  }
}
