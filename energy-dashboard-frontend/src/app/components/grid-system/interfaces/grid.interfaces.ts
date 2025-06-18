/**
 * Custom Grid System Interfaces
 * Comprehensive grid system for energy dashboard widgets
 */

export interface GridPosition {
  x: number;
  y: number;
}

export interface GridSize {
  width: number;
  height: number;
}

export interface GridBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface GridItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  fixed?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  data?: any;
}

export interface GridConfig {
  // Grid dimensions
  columns: number;
  rows?: number;
  margin: number;
  cellHeight: number;

  // Behavior
  draggable: boolean;
  resizable: boolean;
  pushItems: boolean;
  swapItems: boolean;
  compactType: 'vertical' | 'horizontal' | 'none';

  // Constraints
  maxRows?: number;
  minCols?: number;
  maxCols?: number;

  // Responsive
  breakpoints?: GridBreakpoint[];

  // Animation
  animate: boolean;
  animationDuration: number;

  // Styling
  gridBackgroundColor?: string;
  gridLineColor?: string;
  gridLineWidth?: number;
  gridLineStyle?: 'solid' | 'dashed' | 'dotted';

  // Events
  onItemChange?: (item: GridItem, oldItem: GridItem) => void;
  onItemResize?: (item: GridItem, oldItem: GridItem) => void;
  onItemDrag?: (item: GridItem) => void;
  onLayoutChange?: (layout: GridItem[]) => void;
  onCollision?: (item: GridItem, collisions: GridItem[]) => void;
}

export interface GridBreakpoint {
  breakpoint: string;
  minWidth: number;
  columns: number;
  margin?: number;
  cellHeight?: number;
}

export interface DragEvent {
  item: GridItem;
  position: GridPosition;
  size: GridSize;
  bounds: GridBounds;
  event: MouseEvent | TouchEvent;
}

export interface ResizeEvent {
  item: GridItem;
  position: GridPosition;
  size: GridSize;
  bounds: GridBounds;
  direction: ResizeDirection;
  event: MouseEvent | TouchEvent;
}

export type ResizeDirection =
  | 'n' | 's' | 'e' | 'w'
  | 'ne' | 'nw' | 'se' | 'sw';

export interface GridState {
  items: GridItem[];
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  containerWidth: number;
  containerHeight: number;
  isDragging: boolean;
  isResizing: boolean;
  dragItem?: GridItem;
  resizeItem?: GridItem;
}

export interface CollisionResult {
  hasCollision: boolean;
  collisions: GridItem[];
  suggestedPosition?: GridPosition;
}

export interface GridUtils {
  getItemBounds(item: GridItem, cellWidth: number, cellHeight: number, margin: number): GridBounds;
  checkCollision(item: GridItem, items: GridItem[]): CollisionResult;
  findAvailablePosition(item: GridItem, items: GridItem[], columns: number): GridPosition;
  compactLayout(items: GridItem[], columns: number, compactType: string): GridItem[];
  getResponsiveColumns(containerWidth: number, breakpoints: GridBreakpoint[]): number;
}

export interface GridAPI {
  addItem(item: Partial<GridItem>): void;
  removeItem(id: string): void;
  updateItem(id: string, updates: Partial<GridItem>): void;
  moveItem(id: string, position: GridPosition): void;
  resizeItem(id: string, size: GridSize): void;
  getItem(id: string): GridItem | undefined;
  getAllItems(): GridItem[];
  compact(): void;
  getLayout(): GridItem[];
  setLayout(layout: GridItem[]): void;
  exportLayout(): string;
  importLayout(layout: string): void;
  refresh(): void;
}

// Widget-specific interfaces for energy dashboard
export interface EnergyWidget extends GridItem {
  type: 'metric' | 'chart' | 'table' | 'gauge' | 'map';
  title: string;
  config: WidgetConfig;
  refreshInterval?: number;
  dataSource?: string;
}

export interface WidgetConfig {
  // Metric widget config
  metric?: {
    field: string;
    label: string;
    unit: string;
    format?: string;
    threshold?: {
      warning: number;
      critical: number;
    };
  };

  // Chart widget config
  chart?: {
    type: string;
    series: any[];
    xAxis?: any;
    yAxis?: any;
    options?: any;
  };

  // Table widget config
  table?: {
    columns: any[];
    dataSource: string;
    pagination?: boolean;
    sorting?: boolean;
    filtering?: boolean;
  };

  // Common config
  theme?: string;
  colors?: string[];
  animation?: boolean;
}

export interface GridTemplate {
  id: string;
  name: string;
  description: string;
  layout: GridItem[];
  config: GridConfig;
  category: string;
  tags: string[];
  preview?: string;
}
