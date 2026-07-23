import { beforeEach, describe, expect, it } from 'vitest';
import { seatColour, useSeatsStore } from './seats.store';

const store = () => useSeatsStore.getState();

beforeEach(() => store().reset());

describe('seatsStore', () => {
  it('snapshot replaces state: stale held and sold seats become free', () => {
    store().applySnapshot(1, { held: [], sold: [20] });
    store().applyDelta({
      type: 'seat.held',
      event_id: 1,
      seat_ids: [10],
      session_id: 's1',
    });

    store().applySnapshot(1, { held: [30], sold: [] });

    expect(store().status).toEqual({ 30: 'held' });
    expect(store().holder).toEqual({});
  });

  it('applies seat.held, seat.released and seat.sold', () => {
    store().applySnapshot(1, { held: [], sold: [] });

    store().applyDelta({
      type: 'seat.held',
      event_id: 1,
      seat_ids: [1, 2],
      session_id: 's1',
    });
    expect(store().status).toEqual({ 1: 'held', 2: 'held' });
    expect(store().holder).toEqual({ 1: 's1', 2: 's1' });

    store().applyDelta({ type: 'seat.released', event_id: 1, seat_ids: [1] });
    expect(store().status).toEqual({ 2: 'held' });
    expect(store().holder).toEqual({ 2: 's1' });

    store().applyDelta({ type: 'seat.sold', event_id: 1, seat_ids: [2, 3] });
    expect(store().status).toEqual({ 2: 'sold', 3: 'sold' });
    expect(store().holder).toEqual({});
  });

  it('ignores deltas for another event, and before any snapshot', () => {
    store().applyDelta({ type: 'seat.sold', event_id: 1, seat_ids: [5] });
    expect(store().status).toEqual({});

    store().applySnapshot(1, { held: [7], sold: [] });
    store().applyDelta({
      type: 'seat.held',
      event_id: 2,
      seat_ids: [8],
      session_id: 's1',
    });
    store().applyDelta({ type: 'seat.released', event_id: 2, seat_ids: [7] });
    store().applyDelta({ type: 'seat.sold', event_id: 2, seat_ids: [7] });

    expect(store().eventId).toBe(1);
    expect(store().status).toEqual({ 7: 'held' });
    expect(store().holder).toEqual({});
  });

  it('keeps a sold seat sold after a late release or hold', () => {
    store().applySnapshot(1, { held: [], sold: [] });
    store().applyDelta({ type: 'seat.sold', event_id: 1, seat_ids: [4] });

    store().applyDelta({ type: 'seat.released', event_id: 1, seat_ids: [4] });
    expect(store().status).toEqual({ 4: 'sold' });

    store().applyDelta({
      type: 'seat.held',
      event_id: 1,
      seat_ids: [4],
      session_id: 's1',
    });
    expect(store().status).toEqual({ 4: 'sold' });
    expect(store().holder).toEqual({});
  });

  it('resolves a seat in both held and sold of a snapshot to sold', () => {
    store().applySnapshot(1, { held: [6], sold: [6] });
    expect(store().status).toEqual({ 6: 'sold' });
  });
});

describe('seatColour', () => {
  it('yields mine via holder or cart, held for a foreign session', () => {
    store().applySnapshot(1, { held: [2], sold: [3] });
    store().applyDelta({
      type: 'seat.held',
      event_id: 1,
      seat_ids: [1],
      session_id: 'me',
    });
    store().applyDelta({
      type: 'seat.held',
      event_id: 1,
      seat_ids: [4],
      session_id: 'other',
    });
    const state = store();

    expect(seatColour(1, state, [], 'me')).toBe('mine');
    expect(seatColour(2, state, [2], 'me')).toBe('mine');
    expect(seatColour(2, state, [], 'me')).toBe('held');
    expect(seatColour(4, state, [], 'me')).toBe('held');
    expect(seatColour(3, state, [3], 'me')).toBe('sold');
    expect(seatColour(9, state, [9], 'me')).toBe('free');
  });
});
