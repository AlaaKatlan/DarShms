import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Alert {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    private alertSubject = new Subject<Alert>();
    public alert$ = this.alertSubject.asObservable();

    show(type: Alert['type'], message: string) {
        this.alertSubject.next({ type, message });
    }
}
