import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertService, Alert } from '../../../core/services/alert.service';

@Component({
    selector: 'app-alert',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="alert-container" *ngIf="alert">
      <div class="alert" [ngClass]="alert.type">
        <span>{{ alert.message }}</span>
        <button (click)="close()">&times;</button>
      </div>
    </div>
  `,
    styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit, OnDestroy {
    alert: Alert | null = null;
    private subscription?: Subscription;
    private timeout?: any;

    constructor(private alertService: AlertService) { }

    ngOnInit() {
        this.subscription = this.alertService.alert$.subscribe(alert => {
            this.alert = alert;
            if (this.timeout) clearTimeout(this.timeout);

            this.timeout = setTimeout(() => {
                this.close();
            }, 3000);
        });
    }

    close() {
        this.alert = null;
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
        if (this.timeout) clearTimeout(this.timeout);
    }
}
