import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomGridComponent } from '../components/custom-grid/custom-grid.component';
import { GridConfig, GridItem } from '../interfaces/grid.interfaces';

@Component({
  selector: 'ng-grid-basic-example',
  standalone: true,
  imports: [CommonModule, CustomGridComponent],
  template: `
    <div class="example-container">
      <h2>Basic Grid Example</h2>
      
      <div class="controls">
        <button (click)="addRandomItem()">Add Item</button>
        <button (click)="compact()">Compact</button>
        <button (click)="clearAll()">Clear All</button>
      </div>
      
      <ng-advanced-grid
        [config]="gridConfig"
        [items]="gridItems"
        [itemTemplate]="itemTemplate"
        [showGrid]="true"
        (layoutChange)="onLayoutChange($event)"
        (itemClick)="onItemClick($event)">
      </ng-advanced-grid>
      
      <ng-template #itemTemplate let-item="item">
        <div class="example-widget">
          <div class="widget-header">
            <span>{{ item.data?.title || 'Widget ' + item.id }}</span>
            <button (click)="removeItem(item.id)" (mousedown)="$event.stopPropagation()">×</button>
          </div>
          <div class="widget-content">
            <p>Position: ({{ item.x }}, {{ item.y }})</p>
            <p>Size: {{ item.width }} × {{ item.height }}</p>
            <p>{{ item.data?.content || 'Sample content' }}</p>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .example-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .controls {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
    }
    
    .controls button {
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .controls button:hover {
      background: #f5f5f5;
    }
    
    .example-widget {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      font-weight: 500;
    }
    
    .widget-header button {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #666;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .widget-header button:hover {
      color: #f44336;
    }
    
    .widget-content {
      flex: 1;
      padding: 12px;
      font-size: 14px;
      color: #666;
    }
    
    .widget-content p {
      margin: 4px 0;
    }
  `]
})
export class BasicExampleComponent {
  @ViewChild(CustomGridComponent) grid!: CustomGridComponent;
  @ViewChild('itemTemplate') itemTemplate!: TemplateRef<any>;

  gridConfig: GridConfig = {
    columns: 12,
    margin: 10,
    cellHeight: 80,
    draggable: true,
    resizable: true,
    pushItems: true,
    swapItems: false,
    compactType: 'vertical',
    animate: true,
    animationDuration: 300
  };

  gridItems: GridItem[] = [
    {
      id: '1',
      x: 0, y: 0, width: 4, height: 3,
      data: { title: 'Sample Widget 1', content: 'This is a draggable and resizable widget.' }
    },
    {
      id: '2',
      x: 4, y: 0, width: 3, height: 2,
      data: { title: 'Sample Widget 2', content: 'Try dragging me around!' }
    },
    {
      id: '3',
      x: 7, y: 0, width: 5, height: 4,
      data: { title: 'Sample Widget 3', content: 'You can also resize me by dragging the corners.' }
    }
  ];

  private nextId = 4;

  addRandomItem(): void {
    const sizes = [
      { width: 2, height: 2 },
      { width: 3, height: 2 },
      { width: 4, height: 3 },
      { width: 2, height: 3 }
    ];
    const size = sizes[Math.floor(Math.random() * sizes.length)];

    const newItem: Partial<GridItem> = {
      id: this.nextId.toString(),
      width: size.width,
      height: size.height,
      data: {
        title: `New Widget ${this.nextId}`,
        content: `This widget was added dynamically at ${new Date().toLocaleTimeString()}.`
      }
    };

    this.grid.addItem(newItem);
    this.nextId++;
  }

  removeItem(id: string): void {
    this.grid.removeItem(id);
  }

  compact(): void {
    this.grid.compact();
  }

  clearAll(): void {
    this.gridItems = [];
  }

  onLayoutChange(layout: GridItem[]): void {
    this.gridItems = layout;
    console.log('Layout changed:', layout);
  }

  onItemClick(item: GridItem): void {
    console.log('Item clicked:', item);
  }
}
