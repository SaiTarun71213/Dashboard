# NgAdvancedGrid

[![npm version](https://badge.fury.io/js/ng-advanced-grid.svg)](https://badge.fury.io/js/ng-advanced-grid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, feature-rich Angular grid system with advanced drag-and-drop, resize, and responsive capabilities. Perfect for building dynamic dashboards and layout systems.

## ✨ Features

- 🎯 **Drag & Drop** - Smooth drag-and-drop with collision detection
- 📏 **Resize** - 8-direction resize handles with constraints
- 📱 **Responsive** - Breakpoint-based responsive layouts
- 🎨 **Animations** - Smooth transitions and visual feedback
- 🔧 **Auto-Layout** - Smart positioning and compacting
- 📊 **Touch Support** - Mobile-friendly interactions
- 🎛️ **Configurable** - Extensive customization options
- 🚀 **Performance** - Optimized for large grids
- 📦 **TypeScript** - Full TypeScript support
- 🎨 **Themeable** - Easy to customize appearance

## 🚀 Installation

```bash
npm install ng-advanced-grid
```

## 📖 Quick Start

### 1. Import the Module

```typescript
import { NgAdvancedGridModule } from 'ng-advanced-grid';

@NgModule({
  imports: [NgAdvancedGridModule],
  // ...
})
export class AppModule { }
```

### 2. Basic Usage

```html
<ng-advanced-grid
  [config]="gridConfig"
  [items]="gridItems"
  [itemTemplate]="itemTemplate"
  (layoutChange)="onLayoutChange($event)">
</ng-advanced-grid>

<ng-template #itemTemplate let-item="item">
  <div class="widget-content">
    <h3>{{ item.data?.title }}</h3>
    <p>{{ item.data?.content }}</p>
  </div>
</ng-template>
```

### 3. Component Setup

```typescript
import { GridConfig, GridItem } from 'ng-advanced-grid';

export class MyComponent {
  gridConfig: GridConfig = {
    columns: 12,
    margin: 10,
    cellHeight: 80,
    draggable: true,
    resizable: true,
    animate: true
  };

  gridItems: GridItem[] = [
    {
      id: '1',
      x: 0, y: 0,
      width: 4, height: 3,
      data: { title: 'Widget 1', content: 'Content here' }
    }
  ];

  onLayoutChange(layout: GridItem[]) {
    console.log('Layout changed:', layout);
  }
}
```

## 🎛️ Configuration

### Grid Configuration

```typescript
interface GridConfig {
  columns: number;              // Number of columns (default: 12)
  rows?: number;               // Number of rows (auto if not set)
  margin: number;              // Margin between items (default: 10)
  cellHeight: number;          // Height of each cell (default: 60)
  
  // Behavior
  draggable: boolean;          // Enable drag-and-drop (default: true)
  resizable: boolean;          // Enable resizing (default: true)
  pushItems: boolean;          // Push items when dragging (default: true)
  swapItems: boolean;          // Swap items when dragging (default: false)
  compactType: 'vertical' | 'horizontal' | 'none'; // Compaction type
  
  // Animation
  animate: boolean;            // Enable animations (default: true)
  animationDuration: number;   // Animation duration in ms (default: 300)
  
  // Responsive
  breakpoints?: GridBreakpoint[];
}
```

### Grid Item Configuration

```typescript
interface GridItem {
  id: string;                  // Unique identifier
  x: number;                   // X position in grid
  y: number;                   // Y position in grid
  width: number;               // Width in grid units
  height: number;              // Height in grid units
  
  // Constraints
  minWidth?: number;           // Minimum width
  minHeight?: number;          // Minimum height
  maxWidth?: number;           // Maximum width
  maxHeight?: number;          // Maximum height
  
  // Behavior
  fixed?: boolean;             // Prevent moving/resizing
  draggable?: boolean;         // Override global draggable
  resizable?: boolean;         // Override global resizable
  
  data?: any;                  // Custom data for the item
}
```

## 🎨 Styling

The grid system comes with minimal default styles. You can customize the appearance:

```scss
.custom-grid-container {
  background: #f5f5f5;
  border-radius: 8px;
}

.grid-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  
  &.dragging {
    transform: rotate(2deg) scale(1.02);
    z-index: 1000;
  }
}
```

## 📱 Responsive Breakpoints

```typescript
const responsiveConfig: GridConfig = {
  columns: 12,
  breakpoints: [
    { breakpoint: 'xl', minWidth: 1200, columns: 12 },
    { breakpoint: 'lg', minWidth: 992, columns: 8 },
    { breakpoint: 'md', minWidth: 768, columns: 6 },
    { breakpoint: 'sm', minWidth: 576, columns: 4 },
    { breakpoint: 'xs', minWidth: 0, columns: 2 }
  ]
};
```

## 🔧 API Reference

### Grid Component

| Input | Type | Description |
|-------|------|-------------|
| `config` | `GridConfig` | Grid configuration |
| `items` | `GridItem[]` | Array of grid items |
| `itemTemplate` | `TemplateRef` | Template for rendering items |
| `showGrid` | `boolean` | Show grid background |
| `autoResize` | `boolean` | Auto-resize on container changes |

| Output | Type | Description |
|--------|------|-------------|
| `layoutChange` | `GridItem[]` | Emitted when layout changes |
| `itemClick` | `GridItem` | Emitted when item is clicked |
| `itemDoubleClick` | `GridItem` | Emitted when item is double-clicked |
| `dragStart` | `GridItem` | Emitted when drag starts |
| `dragEnd` | `GridItem` | Emitted when drag ends |
| `resizeStart` | `GridItem` | Emitted when resize starts |
| `resizeEnd` | `GridItem` | Emitted when resize ends |

### Grid API Methods

```typescript
// Get grid API reference
@ViewChild(CustomGridComponent) grid!: CustomGridComponent;

// Add item
this.grid.addItem({ width: 2, height: 2, data: { title: 'New Item' } });

// Remove item
this.grid.removeItem('item-id');

// Update item
this.grid.updateItem('item-id', { width: 4, height: 3 });

// Compact layout
this.grid.compact();

// Export/Import layout
const layout = this.grid.exportLayout();
this.grid.importLayout(layout);
```

## 🎯 Examples

### Dashboard Example

```typescript
export class DashboardComponent {
  gridConfig: GridConfig = {
    columns: 12,
    cellHeight: 80,
    margin: 10,
    draggable: true,
    resizable: true,
    animate: true,
    compactType: 'vertical'
  };

  widgets: GridItem[] = [
    {
      id: 'chart-1',
      x: 0, y: 0, width: 6, height: 4,
      data: { type: 'chart', title: 'Sales Chart' }
    },
    {
      id: 'metric-1',
      x: 6, y: 0, width: 3, height: 2,
      data: { type: 'metric', title: 'Total Sales', value: '$12,345' }
    }
  ];
}
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by React Grid Layout and Angular Gridster
- Built with Angular and TypeScript
- Uses RxJS for reactive state management
