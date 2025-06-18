import { Routes } from '@angular/router';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { ChartBuilderComponent } from './components/chart-builder/chart-builder.component';
import { DashboardDesignerComponent } from './components/dashboard-designer/dashboard-designer.component';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardOverviewComponent },
    { path: 'overview', component: DashboardOverviewComponent },
    { path: 'chart-builder', component: ChartBuilderComponent },
    { path: 'dashboard-designer', component: DashboardDesignerComponent },
    {
        path: 'drag-test',
        loadComponent: () => import('./components/drag-drop-test/drag-drop-test.component').then(m => m.DragDropTestComponent)
    },
    {
        path: 'grid-demo',
        loadComponent: () => import('./components/grid-system/demo/grid-demo.component').then(m => m.GridDemoComponent)
    },
    {
        path: 'library-demo',
        loadComponent: () => import('./components/library-demo/library-demo.component').then(m => m.LibraryDemoComponent)
    },
    { path: '**', redirectTo: '/dashboard' }
];
