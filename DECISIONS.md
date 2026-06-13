# Architectural Decisions — Conduit Agent Observability Console

This document outlines the key design, layout, and protocol decisions made during the overhaul of the Agent Observability Console.

---

## 1. UI Design & Styling System (Neobrutalism)
We transitioned the interface from standard modern flat layouts to a **Neobrutalism** aesthetic.

### Styling Choice: Teal & Cream Custom Palette
Instead of using the default high-contrast yellow/white neobrutalist colors, we implemented a custom palette to provide a distinct, premium, and observability-focused feel:
- **Canvas Background**: Soft cream (`#e8e0d4`) with a radial dot grid pattern for a tactile, graph-paper feel.
- **Primary Accent**: High-visibility teal (`#5eead4`) for active indicators, titles, and principal buttons.
- **Card Backgrounds**: Flat white (`#ffffff`) cards with thick, solid borders (`2px solid #000000`).
- **Shadows**: Hard, offset flat shadows (`4px 4px 0px 0px #000000`) that do not blur, defining the classic neobrutalist visual hierarchy.
- **Typography**: Imported and configured `Outfit` for strong, modern headings, while utilizing `JetBrains Mono` for sequence numbers, badges, status indicators, and logs.

---

## 2. Bidirectional Observability Layout
The dashboard layout is divided into three major structural columns, mirroring a complete live telemetry setup:
1. **Trace Timeline (Left)**: Sequence-indexed, type-filtered observability feed showing event flow.
2. **Streaming Feed (Center)**: Real-time user messages, agent token streaming blocks, and tool execution cards.
3. **Context State (Right)**: Interactive historical context state visualizer displaying state changes and property diffs.

---

## 3. Real-Time Telemetry & WebSocket Metrics
We enhanced the client-side WebSocket state engine (`useWebSocket`) to collect and expose critical network and engine metrics:
- **Transport State**: Live connection health monitor (`connected`, `connecting`, `disconnected`).
- **Expected Sequence**: Expected sequence counter for incoming events.
- **Last Committed**: The highest sequence number successfully parsed, processed, and rendered.
- **Buffer Size**: Size of the reorder buffer. This buffer queues out-of-order packets and processes them sequentially, preventing state corruption from packet-loss/re-ordering.
- **Duplicate Drops**: Counter tracking duplicate messages filtered out by the deduplication engine.
- **Heartbeat Latency**: Live latency measurement calculated from the round-trip time between receiving a `PING` from the server and sending back the corresponding `PONG`.
- **Event Throughput**: Frequency of events processed per second.
- **Reconnect Counts**: Total reconnection attempts, reflecting network instability.

---

## 4. Automated Integration Test Suite (Auto Test Runner)
To address the requirement for testing tool/agent message sequences and resilience to connection drops, we built a client-side **Auto Test Runner** (`AutoTestRunner.tsx`).

### Sequence of Automated Tests
The suite runs through the following sequence automatically:
1. **Reset Session**: Clears the console session and waits for a clean WebSocket connection.
2. **Basic Greeting**: Sends `"hello"` and verifies the response streams tokens.
3. **Test Tool Calls**: Sends `"summary"` to trigger a sequence of tool calls (mocking `lookup_metric`), validating tool execution blocks and acknowledgment logging.
4. **Large Context DB Schema**: Sends `"analyze"` to load a large database schema (validating handling of context payloads >500KB).
5. **Connection Drop Simulation**: Simulates an active network disconnect, verifies that the client buffers messages, reconnects using backoff, and resumes state by requesting the sequence log from `last_seq`.

### State Management & Stability
- State transitions in the test suite are wrapped inside `setTimeout` calls to prevent cascading state updates from triggering synchronous React re-render conflicts.
- Heuristic conditions are implemented for each step's `waitCondition` to confirm stream completion and sequence advancement before proceeding.
