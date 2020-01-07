import { DisplayManager } from '../DisplayManager';

describe('Display Manager', () => {
  describe('next()', () => {
    let display;

    beforeEach(() => {
      display = new DisplayManager();
    });

    test('should return the next stored render', () => {
      const manager = new DisplayManager();
      manager.set({ name: 'Commute Template', template: null, schedule: null }, null);

      const result = manager.next();

      expect(result.value).toHaveProperty('page');
      expect(result.value).toHaveProperty('buffer');
      expect(result.done).toBe(false);
    });

    test('should iterate over stored renders if multiple', () => {
      const manager = new DisplayManager();
      manager.set({ name: 'Commute Home Template', template: null, schedule: null }, null);
      manager.set({ name: 'Commute Work Template', template: null, schedule: null }, null);
      manager.set({ name: 'Random', template: null, schedule: null }, null);

      const result = manager.next();
      const result2 = manager.next();
      const result3 = manager.next();
      const result4 = manager.next();

      expect(result).not.toEqual(result2);
      expect(result2).not.toEqual(result3);
      expect(result4).toEqual(result);
    });

    test('should infinitely loop over stored renders', () => {
      const manager = new DisplayManager();
      manager.set({ name: 'Commute Template', template: null, schedule: null }, null);
      for (let i = 0; i <= 1000; i++) {
        const result = manager.next();
        expect(result.done).toBe(false);
      }
    });

    test.skip('should skip displaying inactive templates', () => {
    });
  });
});
