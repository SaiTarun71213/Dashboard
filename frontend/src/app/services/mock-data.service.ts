import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * MOCK DATA SERVICE
 * Provides mock data for development when backend is not available
 */

export interface StateData {
  id: string;
  name: string;
  totalPower: number;
  efficiency: number;
  plantsCount: number;
  equipmentCount: number;
  status: 'online' | 'offline' | 'maintenance';
  lastUpdate: Date;
}

export interface SectorData {
  totalPower: number;
  avgEfficiency: number;
  totalEquipment: number;
  totalPlants: number;
  timestamp: Date;
  states: StateData[];
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  // Indian states for energy dashboard
  private readonly states = [
    'Maharashtra', 'Gujarat', 'Rajasthan', 'Tamil Nadu',
    'Karnataka', 'Andhra Pradesh', 'Uttar Pradesh', 'Madhya Pradesh'
  ];

  private sectorDataSubject = new BehaviorSubject<SectorData>(this.generateSectorData());
  private stateDataSubject = new BehaviorSubject<StateData[]>(this.generateStateData());

  public sectorData$ = this.sectorDataSubject.asObservable();
  public stateData$ = this.stateDataSubject.asObservable();

  constructor() {
    // Update data every 30 seconds to simulate real-time updates
    interval(30000).subscribe(() => {
      this.updateData();
    });
  }

  /**
   * Generate mock sector data
   */
  private generateSectorData(): SectorData {
    const states = this.generateStateData();
    const totalPower = states.reduce((sum, state) => sum + state.totalPower, 0);
    const avgEfficiency = states.reduce((sum, state) => sum + state.efficiency, 0) / states.length;
    const totalEquipment = states.reduce((sum, state) => sum + state.equipmentCount, 0);
    const totalPlants = states.reduce((sum, state) => sum + state.plantsCount, 0);

    return {
      totalPower,
      avgEfficiency,
      totalEquipment,
      totalPlants,
      timestamp: new Date(),
      states
    };
  }

  /**
   * Generate mock state data
   */
  private generateStateData(): StateData[] {
    return this.states.map((stateName, index) => ({
      id: `state-${index + 1}`,
      name: stateName,
      totalPower: this.randomBetween(500, 2000),
      efficiency: this.randomBetween(75, 95),
      plantsCount: this.randomBetween(5, 25),
      equipmentCount: this.randomBetween(50, 200),
      status: this.randomStatus(),
      lastUpdate: new Date()
    }));
  }

  /**
   * Update data with small variations
   */
  private updateData(): void {
    const currentSector = this.sectorDataSubject.value;
    const updatedStates = currentSector.states.map(state => ({
      ...state,
      totalPower: Math.max(100, state.totalPower + this.randomBetween(-50, 50)),
      efficiency: Math.max(50, Math.min(100, state.efficiency + this.randomBetween(-2, 2))),
      lastUpdate: new Date()
    }));

    const updatedSector = {
      ...currentSector,
      totalPower: updatedStates.reduce((sum, state) => sum + state.totalPower, 0),
      avgEfficiency: updatedStates.reduce((sum, state) => sum + state.efficiency, 0) / updatedStates.length,
      timestamp: new Date(),
      states: updatedStates
    };

    this.sectorDataSubject.next(updatedSector);
    this.stateDataSubject.next(updatedStates);
  }

  /**
   * Generate random number between min and max
   */
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random status
   */
  private randomStatus(): 'online' | 'offline' | 'maintenance' {
    const statuses: ('online' | 'offline' | 'maintenance')[] = ['online', 'online', 'online', 'offline', 'maintenance'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  /**
   * Get state data by ID
   */
  getStateById(id: string): Observable<StateData | undefined> {
    return this.stateData$.pipe(
      map(states => states.find(state => state.id === id))
    );
  }

  /**
   * Get states by status
   */
  getStatesByStatus(status: 'online' | 'offline' | 'maintenance'): Observable<StateData[]> {
    return this.stateData$.pipe(
      map(states => states.filter(state => state.status === status))
    );
  }

  /**
   * Get top performing states
   */
  getTopPerformingStates(count: number = 5): Observable<StateData[]> {
    return this.stateData$.pipe(
      map(states =>
        states
          .sort((a, b) => b.efficiency - a.efficiency)
          .slice(0, count)
      )
    );
  }

  /**
   * Get total sector statistics
   */
  getSectorStats(): Observable<{
    totalPower: number;
    avgEfficiency: number;
    onlineStates: number;
    totalStates: number;
  }> {
    return this.sectorData$.pipe(
      map(sector => ({
        totalPower: sector.totalPower,
        avgEfficiency: sector.avgEfficiency,
        onlineStates: sector.states.filter(s => s.status === 'online').length,
        totalStates: sector.states.length
      }))
    );
  }
}
