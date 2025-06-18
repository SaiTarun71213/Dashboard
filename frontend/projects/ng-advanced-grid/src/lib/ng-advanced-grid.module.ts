import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomGridComponent } from './components/custom-grid/custom-grid.component';
import { GridItemComponent } from './components/grid-item/grid-item.component';
import { GridEngineService } from './services/grid-engine.service';
import { GridUtilsService } from './services/grid-utils.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CustomGridComponent,
    GridItemComponent
  ],
  exports: [
    CustomGridComponent,
    GridItemComponent
  ],
  providers: [
    GridEngineService,
    GridUtilsService
  ]
})
export class NgAdvancedGridModule { }
