export function* createCycleGenerator<T>(items: T[]): Iterator<T> {
  while (items.length) {
    for (const item of items) {
      yield item;
    }
  }
}
