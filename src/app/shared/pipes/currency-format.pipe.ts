import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'currencyFormat',
    standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
    transform(value: number | string, currencyCode: string = 'AED'): string {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return value.toString();

        return `${num.toFixed(2)} ${currencyCode}`;
    }
}
