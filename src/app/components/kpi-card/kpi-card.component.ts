import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-card" [class.kpi-alert]="isAlert">
      <div class="kpi-icon-container" [ngClass]="'icon-' + type">
        <!-- SVG Icons based on type -->
        <svg *ngIf="type === 'stock'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.2411h3.86a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0121.75 22.5H2.25A2.25 2.25 0 010 20.25v-4.5A2.25 2.25 0 012.25 13.5zm0-3h18a2.25 2.25 0 002.25-2.25V3.75A2.25 2.25 0 0021.75 1.5H2.25A2.25 2.25 0 000 3.75v4.5A2.25 2.25 0 002.25 10.5z" />
        </svg>
        <svg *ngIf="type === 'value'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg *ngIf="type === 'critical'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <svg *ngIf="type === 'category'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.125 1.125 0 001.59 0l7.22-7.22a1.125 1.125 0 000-1.59L12.46 3.66a2.25 2.25 0 00-1.59-.659h-1.3z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      </div>
      <div class="kpi-info">
        <span class="kpi-title">{{ title }}</span>
        <span class="kpi-value">{{ value }}</span>
        <span class="kpi-subtext" [class.subtext-alert]="isAlert">{{ subtext }}</span>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      transition: all var(--transition-normal);
      position: relative;
      overflow: hidden;
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--border-color);
      transition: all var(--transition-normal);
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    .kpi-card:hover::before {
      background: var(--color-primary);
    }

    .kpi-alert {
      border-left: 1px solid #7f1d1d;
    }

    .kpi-alert::before {
      background: var(--color-primary) !important;
    }

    .kpi-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 8px;
      background: var(--bg-surface);
      color: var(--color-text-muted);
      border: 1px solid var(--border-color);
      transition: all var(--transition-normal);
    }

    .kpi-card:hover .kpi-icon-container {
      color: #fff;
    }

    .icon-stock { color: var(--badge-chunin); border-color: rgba(59, 130, 246, 0.2); }
    .icon-value { color: var(--badge-jonin); border-color: rgba(245, 158, 11, 0.2); }
    .icon-critical { color: var(--color-primary); border-color: rgba(204, 0, 0, 0.2); }
    .icon-category { color: var(--badge-anbu); border-color: rgba(139, 92, 246, 0.2); }

    .kpi-card:hover .icon-stock { background: rgba(59, 130, 246, 0.1); }
    .kpi-card:hover .icon-value { background: rgba(245, 158, 11, 0.1); }
    .kpi-card:hover .icon-critical { background: rgba(204, 0, 0, 0.1); }
    .kpi-card:hover .icon-category { background: rgba(139, 92, 246, 0.1); }

    .kpi-info {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .kpi-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .kpi-value {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text);
      margin: 0.15rem 0;
    }

    .kpi-subtext {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .subtext-alert {
      color: #fca5a5;
      font-weight: 500;
    }
  `]
})
export class KpiCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() subtext: string = '';
  @Input() isAlert: boolean = false;
  @Input() type: 'stock' | 'value' | 'critical' | 'category' = 'stock';
}
