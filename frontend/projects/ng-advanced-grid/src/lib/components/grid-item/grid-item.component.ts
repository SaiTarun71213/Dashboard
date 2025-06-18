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
import { GridItem, DragEvent, ResizeEvent, ResizeDirection } from '../../interfaces/grid.interfaces';

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
        <div class="resize-handle resize-n" data-direction="n"></div>
        <div class="resize-handle resize-s" data-direction="s"></div>
        <div class="resize-handle resize-e" data-direction="e"></div>
        <div class="resize-handle resize-w" data-direction="w"></div>
        <div class="resize-handle resize-ne" data-direction="ne"></div>
        <div class="resize-handle resize-nw" data-direction="nw"></div>
        <div class="resize-handle resize-se" data-direction="se"></div>
        <div class="resize-handle resize-sw" data-direction="sw"></div>
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
      border: 1px solid white;
      border-radius: 2px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .grid-item:hover .resize-handle {
      opacity: 1;
    }
    
    .resize-n, .resize-s {
      left: 50%;
      width: 8px;
      height: 4px;
      margin-left: -4px;
      cursor: ns-resize;
    }
    
    .resize-e, .resize-w {
      top: 50%;
      width: 4px;
      height: 8px;
      margin-top: -4px;
      cursor: ew-resize;
    }
    
    .resize-n { top: -2px; }
    .resize-s { bottom: -2px; }
    .resize-e { right: -2px; }
    .resize-w { left: -2px; }
    
    .resize-ne, .resize-nw, .resize-se, .resize-sw {
      width: 6px;
      height: 6px;
    }
    
    .resize-ne {
      top: -3px;
      right: -3px;
      cursor: ne-resize;
    }
    
    .resize-nw {
      top: -3px;
      left: -3px;
      cursor: nw-resize;
    }
    
    .resize-se {
      bottom: -3px;
      right: -3px;
      cursor: se-resize;
    }
    
    .resize-sw {
      bottom: -3px;
      left: -3px;
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
      this.startResize(event, target.dataset['direction'] as ResizeDirection);
    } else if (this.draggable && !target.closest('.grid-item-content') && !target.closest('.drag-handle')) {
      // Only start drag if not clicking on content or drag handle
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

  onClick(event: MouseEvent): void {
    if (!this.isDragging && !this.isResizing) {
      this.itemClick.emit(this.item);
    }
  }

  onDoubleClick(event: MouseEvent): void {
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
  onEnd(event: MouseEvent | TouchEvent): void {
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

    // Convert pixel movement to grid units
    const gridDeltaX = Math.round(deltaX / (this.cellWidth + this.margin));
    const gridDeltaY = Math.round(deltaY / (this.cellHeight + this.margin));

    let newWidth = this.startWidth;
    let newHeight = this.startHeight;

    // Calculate new dimensions based on resize direction
    if (this.resizeDirection.includes('e')) {
      newWidth = Math.max(this.item.minWidth || 1, this.startWidth + gridDeltaX);
    }
    if (this.resizeDirection.includes('w')) {
      newWidth = Math.max(this.item.minWidth || 1, this.startWidth - gridDeltaX);
    }
    if (this.resizeDirection.includes('s')) {
      newHeight = Math.max(this.item.minHeight || 1, this.startHeight + gridDeltaY);
    }
    if (this.resizeDirection.includes('n')) {
      newHeight = Math.max(this.item.minHeight || 1, this.startHeight - gridDeltaY);
    }

    // Apply max constraints
    if (this.item.maxWidth) {
      newWidth = Math.min(this.item.maxWidth, newWidth);
    }
    if (this.item.maxHeight) {
      newHeight = Math.min(this.item.maxHeight, newHeight);
    }

    const resizeEvent: ResizeEvent = {
      item: this.item,
      position: { x: this.item.x, y: this.item.y },
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
