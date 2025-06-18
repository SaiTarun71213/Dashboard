import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import {
  GridItem,
  GridConfig,
  GridState,
  GridAPI
} from '../../interfaces/grid.interfaces';
import { GridEngineService } from '../../services/grid-engine.service';
import { GridItemComponent } from '../grid-item/grid-item.component';

@Component({
  selector: 'app-custom-grid',
  standalone: true,
  imports: [CommonModule, GridItemComponent],
  template: `
    <div 
      #gridContainer
      class="custom-grid-container"
      [style.height.px]="containerHeight"
      [class.grid-dragging]="state.isDragging"
      [class.grid-resizing]="state.isResizing"
      [class.grid-animated]="config.animate">
      
      <!-- Grid Background (optional) -->
      <div 
        *ngIf="showGrid" 
        class="grid-background"
        [style.background-size]="gridBackgroundSize">
      </div>
      
      <!-- Grid Items -->
      <app-grid-item
        *ngFor="let item of state.items; trackBy: trackByItemId"
        [item]="item"
        [cellWidth]="state.cellWidth"
        [cellHeight]="state.cellHeight"
        [margin]="config.margin || 10"
        [draggable]="!!(item.draggable && config.draggable)"
        [resizable]="!!(item.resizable && config.resizable)"
        [animated]="!!config.animate"
        [animationDuration]="config.animationDuration || 300"
        (dragStart)="onItemDragStart($event)"
        (dragMove)="onItemDragMove($event)"
        (dragEnd)="onItemDragEnd($event)"
        (resizeStart)="onItemResizeStart($event)"
        (resizeMove)="onItemResizeMove($event)"
        (resizeEnd)="onItemResizeEnd($event)"
        (itemClick)="onItemClick($event)"
        (itemDoubleClick)="onItemDoubleClick($event)">
        
        <!-- Content projection -->
        <ng-container 
          *ngTemplateOutlet="itemTemplate; context: { $implicit: item, item: item }">
        </ng-container>
        
      </app-grid-item>
      
      <!-- Drop Zone Indicator -->
      <div 
        *ngIf="showDropZone && dropZonePosition"
        class="drop-zone-indicator"
        [style.left.px]="dropZonePosition.left"
        [style.top.px]="dropZonePosition.top"
        [style.width.px]="dropZonePosition.width"
        [style.height.px]="dropZonePosition.height">
      </div>
      
    </div>
  `,
  styles: [`
    .custom-grid-container {
      position: relative;
      width: 100%;
      overflow: hidden;
      transition: height 0.3s ease;
    }

    .grid-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image:
        linear-gradient(to right, #e0e0e0 1px, transparent 1px),
        linear-gradient(to bottom, #e0e0e0 1px, transparent 1px);
      opacity: 0.5;
      pointer-events: none;
    }

    .grid-dragging {
      user-select: none;
    }

    .grid-resizing {
      user-select: none;
    }

    .grid-animated .grid-item {
      transition: transform 0.3s ease, width 0.3s ease, height 0.3s ease;
    }

    .drop-zone-indicator {
      position: absolute;
      border: 2px dashed #4caf50;
      background: rgba(76, 175, 80, 0.1);
      border-radius: 4px;
      pointer-events: none;
      z-index: 1000;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomGridComponent implements OnInit, OnDestroy {
  @ViewChild('gridContainer', { static: true }) gridContainer!: ElementRef<HTMLDivElement>;

  @Input() config: Partial<GridConfig> = {};
  @Input() items: GridItem[] = [];
  @Input() itemTemplate: any;
  @Input() showGrid = false;
  @Input() showDropZone = true;
  @Input() autoResize = true;

  @Output() layoutChange = new EventEmitter<GridItem[]>();
  @Output() itemChange = new EventEmitter<{ item: GridItem; oldItem: GridItem }>();
  @Output() itemClick = new EventEmitter<GridItem>();
  @Output() itemDoubleClick = new EventEmitter<GridItem>();
  @Output() dragStart = new EventEmitter<GridItem>();
  @Output() dragEnd = new EventEmitter<GridItem>();
  @Output() resizeStart = new EventEmitter<GridItem>();
  @Output() resizeEnd = new EventEmitter<GridItem>();

  state: GridState = {
    items: [],
    columns: 12,
    rows: 0,
    cellWidth: 0,
    cellHeight: 60,
    containerWidth: 0,
    containerHeight: 0,
    isDragging: false,
    isResizing: false
  };

  config$: any;

  dropZonePosition: any = null;
  containerHeight = 0;
  gridBackgroundSize = '';

  private destroy$ = new Subject<void>();
  private resizeObserver?: ResizeObserver;

  constructor(
    private gridEngine: GridEngineService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.config$ = this.gridEngine.config$;
    this.initializeGrid();
    this.subscribeToState();
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  /**
   * Get grid API for external control
   */
  getGridAPI(): GridAPI {
    return this.gridEngine;
  }

  /**
   * Track function for ngFor
   */
  trackByItemId(index: number, item: GridItem): string {
    return item.id;
  }

  /**
   * Event handlers
   */
  onItemDragStart(item: GridItem): void {
    this.gridEngine.startDrag(item);
    this.dragStart.emit(item);
  }

  onItemDragMove(event: any): void {
    // Update item position in real-time
    if (event.position) {
      this.gridEngine.updateItem(event.item.id, {
        x: event.position.x,
        y: event.position.y
      });
    }
    this.updateDropZone(event);
  }

  onItemDragEnd(item: GridItem): void {
    this.gridEngine.endDrag();
    this.dropZonePosition = null;
    this.dragEnd.emit(item);
    this.cdr.markForCheck();
  }

  onItemResizeStart(item: GridItem): void {
    this.gridEngine.startResize(item);
    this.resizeStart.emit(item);
  }

  onItemResizeMove(event: any): void {
    // Update item size in real-time
    if (event.size) {
      this.gridEngine.updateItem(event.item.id, {
        width: event.size.width,
        height: event.size.height
      });
    }
  }

  onItemResizeEnd(item: GridItem): void {
    this.gridEngine.endResize();
    this.resizeEnd.emit(item);
  }

  onItemClick(item: GridItem): void {
    this.itemClick.emit(item);
  }

  onItemDoubleClick(item: GridItem): void {
    this.itemDoubleClick.emit(item);
  }

  /**
   * Public API methods
   */
  addItem(item: Partial<GridItem>): void {
    this.gridEngine.addItem(item);
  }

  removeItem(id: string): void {
    this.gridEngine.removeItem(id);
  }

  updateItem(id: string, updates: Partial<GridItem>): void {
    this.gridEngine.updateItem(id, updates);
  }

  compact(): void {
    this.gridEngine.compact();
  }

  refresh(): void {
    this.updateContainerSize();
    this.gridEngine.refresh();
  }

  exportLayout(): string {
    return this.gridEngine.exportLayout();
  }

  importLayout(layout: string): void {
    this.gridEngine.importLayout(layout);
  }

  /**
   * Private methods
   */
  private initializeGrid(): void {
    // Initialize grid engine with config
    this.gridEngine.initialize(this.config);

    // Set initial items
    if (this.items.length > 0) {
      this.gridEngine.setLayout(this.items);
    }

    // Update container size
    setTimeout(() => {
      this.updateContainerSize();
    });
  }

  private subscribeToState(): void {
    // Subscribe to grid state changes
    this.gridEngine.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.state = state;
        this.updateContainerHeight();
        this.updateGridBackground();
        this.cdr.markForCheck();
      });

    // Subscribe to config changes
    this.gridEngine.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.updateGridBackground();
        this.cdr.markForCheck();
      });
  }

  private setupResizeObserver(): void {
    if (!this.autoResize || !window.ResizeObserver) return;

    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.gridEngine.setContainerSize(width, height);
      }
    });

    this.resizeObserver.observe(this.gridContainer.nativeElement);
  }

  private updateContainerSize(): void {
    const container = this.gridContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    this.gridEngine.setContainerSize(rect.width, rect.height);
  }

  private updateContainerHeight(): void {
    const totalHeight = this.state.rows * this.state.cellHeight +
      (this.state.rows - 1) * this.config.margin! +
      this.config.margin! * 2;
    this.containerHeight = Math.max(400, totalHeight);
  }

  private updateGridBackground(): void {
    if (!this.showGrid) return;

    const cellWidth = this.state.cellWidth + this.config.margin!;
    const cellHeight = this.state.cellHeight + this.config.margin!;
    this.gridBackgroundSize = `${cellWidth}px ${cellHeight}px`;
  }

  private updateDropZone(event: any): void {
    if (!this.showDropZone) return;

    // Calculate drop zone position based on drag event
    // This would be implemented based on specific requirements
    this.dropZonePosition = {
      left: event.x,
      top: event.y,
      width: event.width,
      height: event.height
    };
  }
}
