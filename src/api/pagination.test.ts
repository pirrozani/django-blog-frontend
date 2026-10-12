import { describe, expect, it } from 'vitest';
import { toPage } from './pagination.ts';

const numbers = Array.from({ length: 23 }, (_, i) => i + 1);

describe('toPage with a plain array', () => {
  it('returns the first page', () => {
    expect(toPage(numbers, 1)).toEqual({
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      count: 23,
      page: 1,
      pageSize: 10,
      totalPages: 3,
    });
  });

  it('returns page 2 and a short last page', () => {
    expect(toPage(numbers, 2).items).toEqual([
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);
    expect(toPage(numbers, 3).items).toEqual([21, 22, 23]);
  });

  it('returns no items past the end', () => {
    const page = toPage(numbers, 4);
    expect(page.items).toEqual([]);
    expect(page.totalPages).toBe(3);
  });

  it('handles an empty list', () => {
    expect(toPage([], 1)).toEqual({
      items: [],
      count: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
  });

  it('treats an invalid page as page 1', () => {
    expect(toPage(numbers, 0).page).toBe(1);
    expect(toPage(numbers, Number.NaN).page).toBe(1);
  });

  it('clamps an invalid page size to at least 1', () => {
    expect(toPage(numbers, 1, 0).pageSize).toBe(1);
    expect(toPage(numbers, 1, 0).totalPages).toBe(23);
  });

  it('honours a custom page size', () => {
    expect(toPage(numbers, 2, 5).items).toEqual([6, 7, 8, 9, 10]);
    expect(toPage(numbers, 2, 5).totalPages).toBe(5);
  });
});

describe('toPage with a paginated response', () => {
  it('uses results and count as-is', () => {
    const data = {
      count: 23,
      next: 'http://127.0.0.1:8000/api/blogs/?page=3',
      previous: 'http://127.0.0.1:8000/api/blogs/?page=1',
      results: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    };
    expect(toPage(data, 2)).toEqual({
      items: data.results,
      count: 23,
      page: 2,
      pageSize: 10,
      totalPages: 3,
    });
  });

  it('handles an empty paginated response', () => {
    const page = toPage(
      { count: 0, next: null, previous: null, results: [] },
      1,
    );
    expect(page.items).toEqual([]);
    expect(page.totalPages).toBe(1);
  });
});
