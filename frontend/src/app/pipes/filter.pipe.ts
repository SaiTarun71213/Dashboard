import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], property: string, value: any): any[] {
    if (!items || !property || value === undefined || value === null) {
      return items;
    }

    return items.filter(item => {
      const itemValue = this.getNestedProperty(item, property);
      
      if (typeof value === 'string') {
        return itemValue && itemValue.toString().toLowerCase().includes(value.toLowerCase());
      }
      
      return itemValue === value;
    });
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current && current[prop], obj);
  }
}
