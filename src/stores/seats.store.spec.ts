import { beforeEach, describe, expect, it } from 'vitest';
import { restSnapshot, seatColour, useSeatsStore } from './seats.store';

const store = () => useSeatsStore.getState();

beforeEach(() => store().reset());

describe('seatsStore', () => {
  it('snapshot replaces state: stale held and sold seats become free', () => {
    store().applySnapshot(1, { held: [], sold: [20] });
    store().applyDelta({
      type: 'seat.held',
      event_id: 1,
      seat_ids: [10],
    });

    store().applySnapshot(1, { held: [30], sold: [] });

    expect(store().status).toEqual({ 30: 'held' });
  });

  it('applies seat.held, seat.released and seat.sold', () => {
    store().applySnapshot(1, { held: [], sold: [] });

    store().applyDelta({
      type: 'seat.held',
      event_id: 1,
      seat_ids: [1, 2],
    });
    expect(store().status).toEqual({ 1: 'held', 2: 'held' });

    store().applyDelta({ type: 'seat.released', event_id: 1, seat_ids: [1] });
    expect(store().status).toEqual({ 2: 'held' });

    store().applyDelta({ type: 'seat.sold', event_id: 1, seat_ids: [2, 3] });
    expect(store().status).toEqual({ 2: 'sold', 3: 'sold' });
  });

  it('ignores deltas for another event, and before any snapshot', () => {
    store().applyDelta({ type: 'seat.sold', event_id: 1, seat_ids: [5] });
    expect(store().status).toEqual({});

    store().applySnapshot(1, { held: [7], sold: [] });
    store().applyDelta({
      type: 'seat.held',
      event_id: 2,
      seat_ids: [8],
    });
    store().applyDelta({ type: 'seat.released', event_id: 2, seat_ids: [7] });
    store().applyDelta({ type: 'seat.sold', event_id: 2, seat_ids: [7] });

    expect(store().eventId).toBe(1);
    expect(store().status).toEqual({ 7: 'held' });
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
    });
    expect(store().status).toEqual({ 4: 'sold' });
  });

  it('resolves a seat in both held and sold of a snapshot to sold', () => {
    store().applySnapshot(1, { held: [6], sold: [6] });
    expect(store().status).toEqual({ 6: 'sold' });
  });
});

describe('seatColour', () => {
  it('yields mine only via the cart', () => {
    store().applySnapshot(1, { held: [2], sold: [3] });
    store().applyDelta({ type: 'seat.held', event_id: 1, seat_ids: [1] });
    const state = store();

    expect(seatColour(1, state, [1])).toBe('mine');
    expect(seatColour(1, state, [])).toBe('held');
    expect(seatColour(2, state, [2])).toBe('mine');
    expect(seatColour(2, state, [])).toBe('held');
    expect(seatColour(3, state, [3])).toBe('sold');
    expect(seatColour(9, state, [9])).toBe('free');
  });
});

describe('restSnapshot', () => {
  it('unions core sold with live sold, takes held from live only', () => {
    const seats = [
      { id: 1, status: 'sold' },
      { id: 2, status: 'held' },
      { id: 3, status: 'available' },
      { id: 4, status: 'available' },
    ];

    const merged = restSnapshot(seats, { held: [3], sold: [4] });
    expect(merged.held).toEqual([3]);
    expect([...merged.sold].sort()).toEqual([1, 4]);

    expect(restSnapshot(seats, undefined)).toEqual({ held: [], sold: [1] });
  });
});
