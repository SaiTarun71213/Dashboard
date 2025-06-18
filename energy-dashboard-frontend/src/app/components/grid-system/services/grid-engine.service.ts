import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  GridItem,
  GridConfig,
  GridState,
  GridPosition,
  GridSize,
  DragEvent,
  ResizeEvent,
  GridAPI
} from '../interfaces/grid.interfaces';
import { GridUtilsService } from './grid-utils.service';

@Injectable({
  providedIn: 'root'
})
export class GridEngineService implements GridAPI {
  private stateSubject = new BehaviorSubject<GridState>({
    items: [],
    columns: 12,
    rows: 0,
    cellWidth: 0,
    cellHeight: 60,
    containerWidth: 0,
    containerHeight: 0,
    isDragging: false,
    isResizing: false
  });

  private configSubject = new BehaviorSubject<GridConfig>({
    columns: 12,
    margin: 10,
    cellHeight: 60,
    draggable: true,
    resizable: true,
    pushItems: true,
    swapItems: false,
    compactType: 'vertical',
    animate: true,
    animationDuration: 300
  });

  public state$ = this.stateSubject.asObservable();
  public config$ = this.configSubject.asObservable();

  constructor(private gridUtils: GridUtilsService) { }

  /**
   * Initialize grid with configuration
   */
  initialize(config: Partial<GridConfig>): void {
    const currentConfig = this.configSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.configSubject.next(newConfig);

    this.updateState({
      columns: newConfig.columns,
      cellHeight: newConfig.cellHeight
    });
  }

  /**
   * Set container dimensions
   */
  setContainerSize(width: number, height: number): void {
    const state = this.stateSubject.value;
    const config = this.configSubject.value;

    const cellWidth = this.calculateCellWidth(width, config.columns, config.margin);

    this.updateState({
      containerWidth: width,
      containerHeight: height,
      cellWidth
    });
  }

  /**
   * Add item to grid
   */
  addItem(itemData: Partial<GridItem>): void {
    const state = this.stateSubject.value;
    const config = this.configSubject.value;

    const newItem: GridItem = {
      id: itemData.id || this.gridUtils.generateId(),
      x: itemData.x ?? 0,
      y: itemData.y ?? 0,
      width: itemData.width ?? 1,
      height: itemData.height ?? 1,
      minWidth: itemData.minWidth ?? 1,
      minHeight: itemData.minHeight ?? 1,
      maxWidth: itemData.maxWidth,
      maxHeight: itemData.maxHeight,
      fixed: itemData.fixed ?? false,
      resizable: itemData.resizable ?? config.resizable,
      draggable: itemData.draggable ?? config.draggable,
      data: itemData.data
    };

    // Find available position if not specified
    if (itemData.x === undefined || itemData.y === undefined) {
      const position = this.gridUtils.findAvailablePosition(
        newItem,
        state.items,
        state.columns
      );
      newItem.x = position.x;
      newItem.y = position.y;
    }

    // Validate item
    const validatedItem = this.gridUtils.validateItem(newItem, state.columns);

    const updatedItems = [...state.items, validatedItem];
    const compactedItems = this.compactIfNeeded(updatedItems);

    this.updateState({ items: compactedItems });
    this.notifyLayoutChange(compactedItems);
  }

  /**
   * Remove item from grid
   */
  removeItem(id: string): void {
    const state = this.stateSubject.value;
    const updatedItems = state.items.filter(item => item.id !== id);
    const compactedItems = this.compactIfNeeded(updatedItems);

    this.updateState({ items: compactedItems });
    this.notifyLayoutChange(compactedItems);
  }

  /**
   * Update item properties
   */
  updateItem(id: string, updates: Partial<GridItem>): void {
    const state = this.stateSubject.value;
    const itemIndex = state.items.findIndex(item => item.id === id);

    if (itemIndex === -1) return;

    const oldItem = state.items[itemIndex];
    const updatedItem = { ...oldItem, ...updates };
    const validatedItem = this.gridUtils.validateItem(updatedItem, state.columns);

    const updatedItems = [...state.items];
    updatedItems[itemIndex] = validatedItem;

    // Don't compact during drag/resize operations for better performance
    const shouldCompact = !state.isDragging && !state.isResizing;
    const finalItems = shouldCompact ? this.compactIfNeeded(updatedItems) : updatedItems;

    this.updateState({ items: finalItems });
    this.notifyItemChange(validatedItem, oldItem);

    if (shouldCompact) {
      this.notifyLayoutChange(finalItems);
    }
  }

  /**
   * Move item to new position
   */
  moveItem(id: string, position: GridPosition): void {
    this.updateItem(id, { x: position.x, y: position.y });
  }

  /**
   * Resize item
   */
  resizeItem(id: string, size: GridSize): void {
    this.updateItem(id, { width: size.width, height: size.height });
  }

  /**
   * Get specific item
   */
  getItem(id: string): GridItem | undefined {
    const state = this.stateSubject.value;
    return state.items.find(item => item.id === id);
  }

  /**
   * Get all items
   */
  getAllItems(): GridItem[] {
    return this.stateSubject.value.items;
  }

  /**
   * Compact layout
   */
  compact(): void {
    const state = this.stateSubject.value;
    const config = this.configSubject.value;

    const compactedItems = this.gridUtils.compactLayout(
      state.items,
      state.columns,
      config.compactType
    );

    this.updateState({ items: compactedItems });
    this.notifyLayoutChange(compactedItems);
  }

  /**
   * Get current layout
   */
  getLayout(): GridItem[] {
    return this.getAllItems();
  }

  /**
   * Set entire layout
   */
  setLayout(layout: GridItem[]): void {
    const state = this.stateSubject.value;
    const validatedItems = layout.map(item =>
      this.gridUtils.validateItem(item, state.columns)
    );

    this.updateState({ items: validatedItems });
    this.notifyLayoutChange(validatedItems);
  }

  /**
   * Export layout as JSON string
   */
  exportLayout(): string {
    return JSON.stringify(this.getLayout(), null, 2);
  }

  /**
   * Import layout from JSON string
   */
  importLayout(layoutJson: string): void {
    try {
      const layout = JSON.parse(layoutJson) as GridItem[];
      this.setLayout(layout);
    } catch (error) {
      console.error('Failed to import layout:', error);
    }
  }

  /**
   * Refresh grid calculations
   */
  refresh(): void {
    const state = this.stateSubject.value;
    const config = this.configSubject.value;

    if (state.containerWidth > 0) {
      const cellWidth = this.calculateCellWidth(
        state.containerWidth,
        state.columns,
        config.margin
      );

      this.updateState({ cellWidth });
    }
  }

  /**
   * Start drag operation
   */
  startDrag(item: GridItem): void {
    this.updateState({
      isDragging: true,
      dragItem: item
    });
  }

  /**
   * Update drag position
   */
  updateDrag(position: GridPosition): void {
    const state = this.stateSubject.value;
    if (!state.dragItem) return;

    // Update item position temporarily
    const updatedItem = { ...state.dragItem, ...position };
    this.updateItemInState(updatedItem);
  }

  /**
   * End drag operation
   */
  endDrag(): void {
    const state = this.stateSubject.value;
    if (!state.dragItem) return;

    const compactedItems = this.compactIfNeeded(state.items);

    this.updateState({
      isDragging: false,
      dragItem: undefined,
      items: compactedItems
    });

    this.notifyLayoutChange(compactedItems);
  }

  /**
   * Start resize operation
   */
  startResize(item: GridItem): void {
    this.updateState({
      isResizing: true,
      resizeItem: item
    });
  }

  /**
   * Update resize dimensions
   */
  updateResize(size: GridSize): void {
    const state = this.stateSubject.value;
    if (!state.resizeItem) return;

    const updatedItem = { ...state.resizeItem, ...size };
    this.updateItemInState(updatedItem);
  }

  /**
   * End resize operation
   */
  endResize(): void {
    const state = this.stateSubject.value;
    if (!state.resizeItem) return;

    const compactedItems = this.compactIfNeeded(state.items);

    this.updateState({
      isResizing: false,
      resizeItem: undefined,
      items: compactedItems
    });

    this.notifyLayoutChange(compactedItems);
  }

  /**
   * Private helper methods
   */
  private updateState(updates: Partial<GridState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...updates };

    // Calculate rows based on items
    if (updates.items) {
      newState.rows = this.calculateRows(updates.items);
    }

    this.stateSubject.next(newState);
  }

  private updateItemInState(updatedItem: GridItem): void {
    const state = this.stateSubject.value;
    const itemIndex = state.items.findIndex(item => item.id === updatedItem.id);

    if (itemIndex !== -1) {
      const updatedItems = [...state.items];
      updatedItems[itemIndex] = updatedItem;
      this.updateState({ items: updatedItems });
    }
  }

  private calculateCellWidth(containerWidth: number, columns: number, margin: number): number {
    return (containerWidth - (columns - 1) * margin) / columns;
  }

  private calculateRows(items: GridItem[]): number {
    return Math.max(0, ...items.map(item => item.y + item.height));
  }

  private compactIfNeeded(items: GridItem[]): GridItem[] {
    const config = this.configSubject.value;
    const state = this.stateSubject.value;

    if (config.compactType === 'none') return items;

    return this.gridUtils.compactLayout(items, state.columns, config.compactType);
  }

  private notifyItemChange(item: GridItem, oldItem: GridItem): void {
    const config = this.configSubject.value;
    if (config.onItemChange) {
      config.onItemChange(item, oldItem);
    }
  }

  private notifyLayoutChange(layout: GridItem[]): void {
    const config = this.configSubject.value;
    if (config.onLayoutChange) {
      config.onLayoutChange(layout);
    }
  }
}
