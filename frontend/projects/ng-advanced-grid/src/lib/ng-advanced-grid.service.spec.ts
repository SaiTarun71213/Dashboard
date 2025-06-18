import { TestBed } from '@angular/core/testing';
import { GridEngineService } from './services/grid-engine.service';
import { GridUtilsService } from './services/grid-utils.service';

describe('NgAdvancedGrid Services', () => {
  let gridEngine: GridEngineService;
  let gridUtils: GridUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GridEngineService, GridUtilsService]
    });
    gridEngine = TestBed.inject(GridEngineService);
    gridUtils = TestBed.inject(GridUtilsService);
  });

  describe('GridEngineService', () => {
    it('should be created', () => {
      expect(gridEngine).toBeTruthy();
    });

    it('should initialize with default config', () => {
      gridEngine.initialize({});
      gridEngine.state$.subscribe(state => {
        expect(state.columns).toBe(12);
        expect(state.items).toEqual([]);
      });
    });

    it('should add items to grid', () => {
      gridEngine.initialize({});
      gridEngine.addItem({ width: 2, height: 2 });
      
      gridEngine.state$.subscribe(state => {
        expect(state.items.length).toBe(1);
        expect(state.items[0].width).toBe(2);
        expect(state.items[0].height).toBe(2);
      });
    });
  });

  describe('GridUtilsService', () => {
    it('should be created', () => {
      expect(gridUtils).toBeTruthy();
    });

    it('should calculate item bounds correctly', () => {
      const item = { id: '1', x: 1, y: 1, width: 2, height: 2 };
      const bounds = gridUtils.getItemBounds(item, 100, 80, 10);
      
      expect(bounds.left).toBe(110); // x * (cellWidth + margin)
      expect(bounds.top).toBe(90);   // y * (cellHeight + margin)
    });

    it('should detect collisions', () => {
      const item1 = { id: '1', x: 0, y: 0, width: 2, height: 2 };
      const item2 = { id: '2', x: 1, y: 1, width: 2, height: 2 };
      const items = [item1];
      
      const result = gridUtils.checkCollision(item2, items);
      expect(result.hasCollision).toBe(true);
      expect(result.collisions.length).toBe(1);
    });

    it('should find available positions', () => {
      const existingItems = [
        { id: '1', x: 0, y: 0, width: 2, height: 2 }
      ];
      const newItem = { id: '2', x: 0, y: 0, width: 2, height: 2 };
      
      const position = gridUtils.findAvailablePosition(newItem, existingItems, 12);
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeGreaterThanOrEqual(0);
    });
  });
});
