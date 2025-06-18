import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridItem, DragEvent, ResizeEvent, ResizeDirection } from '../interfaces/grid.interfaces';

@Component({
  selector: 'app-grid-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      #gridItemElement
      class="grid-item"
      [class.dragging]="isDragging"
      [class.resizing]="isResizing"
      [class.fixed]="item.fixed"
      [class.animated]="animated"
      [style.transform]="transform"
      [style.width.px]="width"
      [style.height.px]="height"
      [style.z-index]="zIndex"
      (mousedown)="onMouseDown($event)"
      (touchstart)="onTouchStart($event)"
      (click)="onClick($event)"
      (dblclick)="onDoubleClick($event)">
      
      <!-- Item Content -->
      <div class="grid-item-content">
        <ng-content></ng-content>
      </div>
      
      <!-- Drag Handle -->
      <div
        *ngIf="draggable && !item.fixed"
        class="drag-handle"
        [class.dragging]="isDragging"
        (mousedown)="onDragHandleMouseDown($event)"
        (touchstart)="onDragHandleTouchStart($event)">
        <div class="drag-dots">
          <span></span><span></span><span></span>
          <span></span><span></span><span></span>
        </div>
      </div>
      
      <!-- Resize Handles -->
      <div *ngIf="resizable && !item.fixed" class="resize-handles">
        <!-- Edge Handles -->
        <div class="resize-handle resize-n edge-handle"
             data-direction="n"
             title="Resize North"
             (mousedown)="onResizeHandleMouseDown($event, 'n')"
             (touchstart)="onResizeHandleTouchStart($event, 'n')">
          <div class="edge-indicator"></div>
        </div>
        <div class="resize-handle resize-s edge-handle"
             data-direction="s"
             title="Resize South"
             (mousedown)="onResizeHandleMouseDown($event, 's')"
             (touchstart)="onResizeHandleTouchStart($event, 's')">
          <div class="edge-indicator"></div>
        </div>
        <div class="resize-handle resize-e edge-handle"
             data-direction="e"
             title="Resize East"
             (mousedown)="onResizeHandleMouseDown($event, 'e')"
             (touchstart)="onResizeHandleTouchStart($event, 'e')">
          <div class="edge-indicator"></div>
        </div>
        <div class="resize-handle resize-w edge-handle"
             data-direction="w"
             title="Resize West"
             (mousedown)="onResizeHandleMouseDown($event, 'w')"
             (touchstart)="onResizeHandleTouchStart($event, 'w')">
          <div class="edge-indicator"></div>
        </div>

        <!-- Corner Handles -->
        <div class="resize-handle resize-ne corner-handle"
             data-direction="ne"
             title="Resize North-East"
             (mousedown)="onResizeHandleMouseDown($event, 'ne')"
             (touchstart)="onResizeHandleTouchStart($event, 'ne')">
          <div class="corner-indicator"></div>
        </div>
        <div class="resize-handle resize-nw corner-handle"
             data-direction="nw"
             title="Resize North-West"
             (mousedown)="onResizeHandleMouseDown($event, 'nw')"
             (touchstart)="onResizeHandleTouchStart($event, 'nw')">
          <div class="corner-indicator"></div>
        </div>
        <div class="resize-handle resize-se corner-handle"
             data-direction="se"
             title="Resize South-East"
             (mousedown)="onResizeHandleMouseDown($event, 'se')"
             (touchstart)="onResizeHandleTouchStart($event, 'se')">
          <div class="corner-indicator"></div>
        </div>
        <div class="resize-handle resize-sw corner-handle"
             data-direction="sw"
             title="Resize South-West"
             (mousedown)="onResizeHandleMouseDown($event, 'sw')"
             (touchstart)="onResizeHandleTouchStart($event, 'sw')">
          <div class="corner-indicator"></div>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    .grid-item {
      position: absolute;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: move;
      overflow: hidden;
      user-select: none;
    }
    
    .grid-item:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .grid-item.dragging {
      z-index: 1000;
      box-shadow: 0 8px 16px rgba(0,0,0,0.3);
      transform: rotate(2deg) scale(1.02);
    }
    
    .grid-item.resizing {
      z-index: 999;
    }
    
    .grid-item.fixed {
      cursor: default;
      opacity: 0.8;
    }
    
    .grid-item.animated {
      transition: transform 0.3s ease, width 0.3s ease, height 0.3s ease;
    }
    
    .grid-item-content {
      width: 100%;
      height: 100%;
      padding: 8px;
      overflow: hidden;
      pointer-events: auto;
    }
    
    .drag-handle {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 16px;
      height: 16px;
      cursor: move;
      opacity: 0.6;
      transition: opacity 0.2s ease;
    }
    
    .drag-handle:hover {
      opacity: 1;
    }
    
    .drag-dots {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      width: 100%;
      height: 100%;
    }
    
    .drag-dots span {
      background: #666;
      border-radius: 50%;
      width: 2px;
      height: 2px;
    }
    
    .resize-handles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .resize-handle {
      position: absolute;
      pointer-events: auto;
      background: #1976d2;
      border: 2px solid white;
      border-radius: 3px;
      opacity: 0;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      z-index: 10;
    }

    .resize-handle:hover {
      background: #1565c0;
      transform: scale(1.1);
      opacity: 1 !important;
    }
    
    .grid-item:hover .resize-handle {
      opacity: 1;
    }

    .grid-item.resizing {
      z-index: 999;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .grid-item.resizing .resize-handle {
      opacity: 1;
      background: #1565c0;
    }

    .grid-item.dragging {
      z-index: 1000;
      transform: rotate(2deg) scale(1.02);
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    
    .resize-n, .resize-s {
      left: 20%;
      width: 60%;
      height: 8px;
      cursor: ns-resize;
    }

    .resize-e, .resize-w {
      top: 20%;
      width: 8px;
      height: 60%;
      cursor: ew-resize;
    }

    .resize-n { top: -3px; }
    .resize-s { bottom: -3px; }
    .resize-e { right: -3px; }
    .resize-w { left: -3px; }

    .resize-ne, .resize-nw, .resize-se, .resize-sw {
      width: 10px;
      height: 10px;
    }

    .corner-handle {
      border-radius: 50%;
    }

    .corner-indicator {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 6px;
      height: 6px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }

    .edge-indicator {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 2px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }

    .resize-n .edge-indicator,
    .resize-s .edge-indicator {
      width: 20px;
      height: 3px;
    }

    .resize-e .edge-indicator,
    .resize-w .edge-indicator {
      width: 3px;
      height: 20px;
    }
    
    .resize-ne {
      top: -5px;
      right: -5px;
      cursor: ne-resize;
    }

    .resize-nw {
      top: -5px;
      left: -5px;
      cursor: nw-resize;
    }

    .resize-se {
      bottom: -5px;
      right: -5px;
      cursor: se-resize;
    }

    .resize-sw {
      bottom: -5px;
      left: -5px;
      cursor: sw-resize;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridItemComponent implements OnInit, OnDestroy {
  @Input() item!: GridItem;
  @Input() cellWidth = 0;
  @Input() cellHeight = 60;
  @Input() margin = 10;
  @Input() draggable = true;
  @Input() resizable = true;
  @Input() animated = true;
  @Input() animationDuration = 300;

  @Output() dragStart = new EventEmitter<GridItem>();
  @Output() dragMove = new EventEmitter<DragEvent>();
  @Output() dragEnd = new EventEmitter<GridItem>();
  @Output() resizeStart = new EventEmitter<GridItem>();
  @Output() resizeMove = new EventEmitter<ResizeEvent>();
  @Output() resizeEnd = new EventEmitter<GridItem>();
  @Output() itemClick = new EventEmitter<GridItem>();
  @Output() itemDoubleClick = new EventEmitter<GridItem>();

  isDragging = false;
  isResizing = false;
  zIndex = 1;

  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private resizeDirection: ResizeDirection | null = null;

  // Bound event handlers to avoid creating new functions
  private boundOnMove = this.onMove.bind(this);
  private boundOnEnd = this.onEnd.bind(this);

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.updatePosition();
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
  }

  get transform(): string {
    const x = this.item.x * (this.cellWidth + this.margin);
    const y = this.item.y * (this.cellHeight + this.margin);
    return `translate3d(${x}px, ${y}px, 0)`;
  }

  get width(): number {
    return this.item.width * this.cellWidth + (this.item.width - 1) * this.margin;
  }

  get height(): number {
    return this.item.height * this.cellHeight + (this.item.height - 1) * this.margin;
  }

  onMouseDown(event: MouseEvent): void {
    if (this.item.fixed) return;

    const target = event.target as HTMLElement;

    if (target.classList.contains('resize-handle')) {
      event.preventDefault();
      event.stopPropagation();
      this.startResize(event, target.dataset['direction'] as ResizeDirection);
    } else if (this.draggable && !target.closest('.grid-item-content') && !target.closest('.resize-handle')) {
      // Start drag if not clicking on content or resize handles
      this.startDrag(event);
    }
  }

  onDragHandleMouseDown(event: MouseEvent): void {
    if (this.item.fixed || !this.draggable) return;
    event.stopPropagation();
    this.startDrag(event);
  }

  onTouchStart(event: TouchEvent): void {
    if (this.item.fixed) return;

    const target = event.target as HTMLElement;
    const touch = event.touches[0];

    if (target.classList.contains('resize-handle')) {
      this.startResize(touch, target.dataset['direction'] as ResizeDirection);
    } else if (this.draggable && !target.closest('.grid-item-content') && !target.closest('.drag-handle')) {
      this.startDrag(touch);
    }
  }

  onDragHandleTouchStart(event: TouchEvent): void {
    if (this.item.fixed || !this.draggable) return;
    event.stopPropagation();
    const touch = event.touches[0];
    this.startDrag(touch);
  }

  onResizeHandleMouseDown(event: MouseEvent, direction: ResizeDirection): void {
    if (this.item.fixed || !this.resizable) return;
    event.preventDefault();
    event.stopPropagation();
    this.startResize(event, direction);
  }

  onResizeHandleTouchStart(event: TouchEvent, direction: ResizeDirection): void {
    if (this.item.fixed || !this.resizable) return;
    event.preventDefault();
    event.stopPropagation();
    const touch = event.touches[0];
    this.startResize(touch, direction);
  }

  onClick(_event: MouseEvent): void {
    if (!this.isDragging && !this.isResizing) {
      this.itemClick.emit(this.item);
    }
  }

  onDoubleClick(_event: MouseEvent): void {
    if (!this.isDragging && !this.isResizing) {
      this.itemDoubleClick.emit(this.item);
    }
  }

  private startDrag(event: MouseEvent | Touch): void {
    this.isDragging = true;
    this.zIndex = 1000;
    this.startX = event.clientX;
    this.startY = event.clientY;

    this.addEventListeners();
    this.dragStart.emit(this.item);
    this.cdr.markForCheck();
  }

  private startResize(event: MouseEvent | Touch, direction: ResizeDirection): void {
    this.isResizing = true;
    this.zIndex = 999;
    this.resizeDirection = direction;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidth = this.item.width;
    this.startHeight = this.item.height;

    this.addEventListeners();
    this.resizeStart.emit(this.item);
    this.cdr.markForCheck();
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging && !this.isResizing) return;

    event.preventDefault();
    const clientEvent = 'touches' in event ? event.touches[0] : event;

    if (this.isDragging) {
      this.handleDragMove(clientEvent);
    } else if (this.isResizing) {
      this.handleResizeMove(clientEvent);
    }
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onEnd(_event: MouseEvent | TouchEvent): void {
    if (this.isDragging) {
      this.endDrag();
    } else if (this.isResizing) {
      this.endResize();
    }
  }

  private handleDragMove(event: MouseEvent | Touch): void {
    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    // Convert pixel movement to grid units
    const gridDeltaX = Math.round(deltaX / (this.cellWidth + this.margin));
    const gridDeltaY = Math.round(deltaY / (this.cellHeight + this.margin));

    const dragEvent: DragEvent = {
      item: this.item,
      position: {
        x: Math.max(0, this.item.x + gridDeltaX),
        y: Math.max(0, this.item.y + gridDeltaY)
      },
      size: { width: this.item.width, height: this.item.height },
      bounds: this.getItemBounds(),
      event: event as any
    };

    this.dragMove.emit(dragEvent);
  }

  private handleResizeMove(event: MouseEvent | Touch): void {
    if (!this.resizeDirection) return;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    // Convert pixel movement to grid units with better sensitivity
    const cellWidthWithMargin = this.cellWidth + this.margin;
    const cellHeightWithMargin = this.cellHeight + this.margin;

    const gridDeltaX = Math.round(deltaX / cellWidthWithMargin);
    const gridDeltaY = Math.round(deltaY / cellHeightWithMargin);

    let newWidth = this.startWidth;
    let newHeight = this.startHeight;
    let newX = this.item.x;
    let newY = this.item.y;

    // Calculate new dimensions based on resize direction
    if (this.resizeDirection.includes('e')) {
      newWidth = Math.max(this.item.minWidth || 1, this.startWidth + gridDeltaX);
    }
    if (this.resizeDirection.includes('w')) {
      const widthChange = Math.min(gridDeltaX, this.startWidth - (this.item.minWidth || 1));
      newWidth = this.startWidth - widthChange;
      newX = this.item.x + widthChange;
    }
    if (this.resizeDirection.includes('s')) {
      newHeight = Math.max(this.item.minHeight || 1, this.startHeight + gridDeltaY);
    }
    if (this.resizeDirection.includes('n')) {
      const heightChange = Math.min(gridDeltaY, this.startHeight - (this.item.minHeight || 1));
      newHeight = this.startHeight - heightChange;
      newY = this.item.y + heightChange;
    }

    // Apply max constraints
    if (this.item.maxWidth) {
      newWidth = Math.min(this.item.maxWidth, newWidth);
    }
    if (this.item.maxHeight) {
      newHeight = Math.min(this.item.maxHeight, newHeight);
    }

    // Ensure position doesn't go negative
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    const resizeEvent: ResizeEvent = {
      item: this.item,
      position: { x: newX, y: newY },
      size: { width: newWidth, height: newHeight },
      bounds: this.getItemBounds(),
      direction: this.resizeDirection,
      event: event as any
    };

    this.resizeMove.emit(resizeEvent);
  }

  private endDrag(): void {
    this.isDragging = false;
    this.zIndex = 1;
    this.removeEventListeners();
    this.dragEnd.emit(this.item);
    this.cdr.markForCheck();
  }

  private endResize(): void {
    this.isResizing = false;
    this.zIndex = 1;
    this.resizeDirection = null;
    this.removeEventListeners();
    this.resizeEnd.emit(this.item);
    this.cdr.markForCheck();
  }

  private getItemBounds() {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom
    };
  }

  private addEventListeners(): void {
    document.addEventListener('mousemove', this.boundOnMove, { passive: false });
    document.addEventListener('mouseup', this.boundOnEnd);
    document.addEventListener('touchmove', this.boundOnMove, { passive: false });
    document.addEventListener('touchend', this.boundOnEnd);
  }

  private removeEventListeners(): void {
    document.removeEventListener('mousemove', this.boundOnMove);
    document.removeEventListener('mouseup', this.boundOnEnd);
    document.removeEventListener('touchmove', this.boundOnMove);
    document.removeEventListener('touchend', this.boundOnEnd);
  }

  private updatePosition(): void {
    this.cdr.markForCheck();
  }
}
