import { Injectable } from '@angular/core';
import { 
  GridItem, 
  GridPosition, 
  GridSize, 
  GridBounds, 
  CollisionResult, 
  GridBreakpoint 
} from '../interfaces/grid.interfaces';

@Injectable({
  providedIn: 'root'
})
export class GridUtilsService {

  /**
   * Get pixel bounds for a grid item
   */
  getItemBounds(
    item: GridItem, 
    cellWidth: number, 
    cellHeight: number, 
    margin: number
  ): GridBounds {
    const left = item.x * (cellWidth + margin);
    const top = item.y * (cellHeight + margin);
    const right = left + (item.width * cellWidth) + ((item.width - 1) * margin);
    const bottom = top + (item.height * cellHeight) + ((item.height - 1) * margin);

    return { top, left, right, bottom };
  }

  /**
   * Check if item collides with other items
   */
  checkCollision(item: GridItem, items: GridItem[]): CollisionResult {
    const collisions: GridItem[] = [];
    
    for (const otherItem of items) {
      if (otherItem.id === item.id) continue;
      
      if (this.itemsOverlap(item, otherItem)) {
        collisions.push(otherItem);
      }
    }

    return {
      hasCollision: collisions.length > 0,
      collisions,
      suggestedPosition: collisions.length > 0 ? 
        this.findNearestAvailablePosition(item, items) : undefined
    };
  }

  /**
   * Check if two items overlap
   */
  private itemsOverlap(item1: GridItem, item2: GridItem): boolean {
    return !(
      item1.x >= item2.x + item2.width ||
      item2.x >= item1.x + item1.width ||
      item1.y >= item2.y + item2.height ||
      item2.y >= item1.y + item1.height
    );
  }

  /**
   * Find available position for new item
   */
  findAvailablePosition(
    item: GridItem, 
    items: GridItem[], 
    columns: number
  ): GridPosition {
    const testItem = { ...item };
    
    // Try positions starting from top-left
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x <= columns - item.width; x++) {
        testItem.x = x;
        testItem.y = y;
        
        if (!this.checkCollision(testItem, items).hasCollision) {
          return { x, y };
        }
      }
    }
    
    // Fallback to bottom
    return { x: 0, y: this.getMaxY(items) + 1 };
  }

  /**
   * Find nearest available position to current position
   */
  private findNearestAvailablePosition(
    item: GridItem, 
    items: GridItem[]
  ): GridPosition {
    const originalX = item.x;
    const originalY = item.y;
    const testItem = { ...item };
    
    // Search in expanding spiral pattern
    for (let radius = 1; radius <= 10; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          
          testItem.x = Math.max(0, originalX + dx);
          testItem.y = Math.max(0, originalY + dy);
          
          if (!this.checkCollision(testItem, items).hasCollision) {
            return { x: testItem.x, y: testItem.y };
          }
        }
      }
    }
    
    return { x: originalX, y: originalY };
  }

  /**
   * Compact layout by moving items up
   */
  compactLayout(
    items: GridItem[], 
    columns: number, 
    compactType: string = 'vertical'
  ): GridItem[] {
    if (compactType === 'none') return items;
    
    const sortedItems = [...items].sort((a, b) => {
      if (compactType === 'vertical') {
        return a.y - b.y || a.x - b.x;
      } else {
        return a.x - b.x || a.y - b.y;
      }
    });

    const compactedItems: GridItem[] = [];

    for (const item of sortedItems) {
      if (item.fixed) {
        compactedItems.push({ ...item });
        continue;
      }

      const compactedItem = { ...item };
      
      if (compactType === 'vertical') {
        // Move item up as much as possible
        for (let y = 0; y < item.y; y++) {
          const testItem = { ...compactedItem, y };
          if (!this.checkCollision(testItem, compactedItems).hasCollision) {
            compactedItem.y = y;
          } else {
            break;
          }
        }
      } else if (compactType === 'horizontal') {
        // Move item left as much as possible
        for (let x = 0; x < item.x; x++) {
          const testItem = { ...compactedItem, x };
          if (!this.checkCollision(testItem, compactedItems).hasCollision) {
            compactedItem.x = x;
          } else {
            break;
          }
        }
      }
      
      compactedItems.push(compactedItem);
    }

    return compactedItems;
  }

  /**
   * Get responsive columns based on container width
   */
  getResponsiveColumns(
    containerWidth: number, 
    breakpoints: GridBreakpoint[]
  ): number {
    const sortedBreakpoints = breakpoints.sort((a, b) => b.minWidth - a.minWidth);
    
    for (const breakpoint of sortedBreakpoints) {
      if (containerWidth >= breakpoint.minWidth) {
        return breakpoint.columns;
      }
    }
    
    return breakpoints[breakpoints.length - 1]?.columns || 12;
  }

  /**
   * Get maximum Y position in layout
   */
  private getMaxY(items: GridItem[]): number {
    return Math.max(0, ...items.map(item => item.y + item.height - 1));
  }

  /**
   * Get maximum X position in layout
   */
  private getMaxX(items: GridItem[]): number {
    return Math.max(0, ...items.map(item => item.x + item.width - 1));
  }

  /**
   * Calculate total height needed for layout
   */
  getLayoutHeight(items: GridItem[], cellHeight: number, margin: number): number {
    const maxY = this.getMaxY(items);
    return (maxY + 1) * cellHeight + maxY * margin;
  }

  /**
   * Validate item constraints
   */
  validateItem(item: GridItem, columns: number): GridItem {
    const validatedItem = { ...item };
    
    // Ensure item fits within grid
    validatedItem.x = Math.max(0, Math.min(item.x, columns - item.width));
    validatedItem.y = Math.max(0, item.y);
    
    // Apply size constraints
    if (item.minWidth) {
      validatedItem.width = Math.max(item.minWidth, validatedItem.width);
    }
    if (item.maxWidth) {
      validatedItem.width = Math.min(item.maxWidth, validatedItem.width);
    }
    if (item.minHeight) {
      validatedItem.height = Math.max(item.minHeight, validatedItem.height);
    }
    if (item.maxHeight) {
      validatedItem.height = Math.min(item.maxHeight, validatedItem.height);
    }
    
    // Ensure item doesn't exceed grid width
    if (validatedItem.x + validatedItem.width > columns) {
      validatedItem.width = columns - validatedItem.x;
    }
    
    return validatedItem;
  }

  /**
   * Generate unique ID for grid items
   */
  generateId(): string {
    return `grid-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clone grid item
   */
  cloneItem(item: GridItem): GridItem {
    return {
      ...item,
      id: this.generateId(),
      data: item.data ? { ...item.data } : undefined
    };
  }

  /**
   * Get grid statistics
   */
  getGridStats(items: GridItem[], columns: number) {
    const totalCells = items.reduce((sum, item) => sum + (item.width * item.height), 0);
    const maxY = this.getMaxY(items);
    const gridArea = columns * (maxY + 1);
    const utilization = gridArea > 0 ? (totalCells / gridArea) * 100 : 0;
    
    return {
      totalItems: items.length,
      totalCells,
      gridHeight: maxY + 1,
      gridArea,
      utilization: Math.round(utilization * 100) / 100,
      emptySpaces: gridArea - totalCells
    };
  }
}
