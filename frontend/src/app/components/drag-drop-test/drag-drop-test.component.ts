import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-drag-drop-test',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    DragDropModule
  ],
  template: `
    <div class="drag-drop-test">
      <h2>Drag & Drop Test</h2>
      <p>Test if Angular CDK drag-drop is working properly</p>
      
      <div class="test-container">
        <!-- Source List -->
        <mat-card class="list-card">
          <mat-card-header>
            <mat-card-title>Available Fields</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="field-list" 
                 cdkDropList 
                 #sourceList="cdkDropList"
                 [cdkDropListData]="availableFields"
                 [cdkDropListConnectedTo]="[targetList]"
                 (cdkDropListDropped)="drop($event)">
              <div *ngFor="let field of availableFields" 
                   class="field-item" 
                   cdkDrag>
                <mat-icon>drag_indicator</mat-icon>
                {{ field }}
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Target List -->
        <mat-card class="list-card">
          <mat-card-header>
            <mat-card-title>Selected Fields</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="field-list" 
                 cdkDropList 
                 #targetList="cdkDropList"
                 [cdkDropListData]="selectedFields"
                 [cdkDropListConnectedTo]="[sourceList]"
                 (cdkDropListDropped)="drop($event)">
              <div *ngFor="let field of selectedFields" 
                   class="field-item selected" 
                   cdkDrag>
                <mat-icon>drag_indicator</mat-icon>
                {{ field }}
              </div>
              <div *ngIf="selectedFields.length === 0" class="placeholder">
                Drop fields here
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
      
      <div class="test-status">
        <p><strong>Status:</strong> {{ dragDropStatus }}</p>
        <p><strong>Available:</strong> {{ availableFields.length }} fields</p>
        <p><strong>Selected:</strong> {{ selectedFields.length }} fields</p>
      </div>
    </div>
  `,
  styles: [`
    .drag-drop-test {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .test-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin: 24px 0;
    }
    
    .list-card {
      min-height: 300px;
    }
    
    .field-list {
      min-height: 200px;
      padding: 8px;
    }
    
    .field-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin: 4px 0;
      background: #f5f5f5;
      border-radius: 4px;
      cursor: grab;
      transition: all 0.2s ease;
    }
    
    .field-item:hover {
      background: #e3f2fd;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .field-item.cdk-drag-dragging {
      cursor: grabbing;
      transform: rotate(5deg);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .field-item.selected {
      background: #e8f5e8;
      border: 1px solid #4caf50;
    }
    
    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 60px;
      border: 2px dashed #ccc;
      border-radius: 4px;
      color: #999;
      font-style: italic;
    }
    
    .cdk-drop-list-dragging .placeholder {
      border-color: #1976d2;
      background: rgba(25, 118, 210, 0.05);
    }
    
    .test-status {
      margin-top: 24px;
      padding: 16px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    
    .test-status p {
      margin: 4px 0;
    }
  `]
})
export class DragDropTestComponent {
  availableFields = [
    'Active Power',
    'Voltage L1',
    'Current L1',
    'Frequency',
    'Wind Speed',
    'Temperature',
    'Efficiency',
    'Availability'
  ];
  
  selectedFields: string[] = [];
  
  dragDropStatus = 'Ready - Try dragging fields between lists';

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.dragDropStatus = 'Reordered items within same list';
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.dragDropStatus = 'Moved item between lists';
    }
  }
}
