import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { InventarioService } from '../../services/inventario.service';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';
import { Suministro } from '../../models/suministro.model';

// Registrar componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent],
  template: `
    <div class="dashboard-container">
      <!-- Sección de KPIs -->
      <div class="kpi-grid">
        <app-kpi-card 
          title="Stock Total Suministros" 
          [value]="stats().totalStock" 
          subtext="Unidades en inventario" 
          type="stock">
        </app-kpi-card>
        
        <app-kpi-card 
          title="Valor del Arsenal" 
          [value]="((stats().totalValor | currency:'JPY':'symbol-narrow':'1.0-0') ?? '')" 
          subtext="Equivalencia en ¥" 
          type="value">
        </app-kpi-card>
        
        <app-kpi-card 
          title="Stock Crítico" 
          [value]="stats().bajoStock" 
          [subtext]="stats().bajoStock > 0 ? '¡Requiere reabastecimiento!' : 'Niveles seguros'" 
          [isAlert]="stats().bajoStock > 0" 
          type="critical">
        </app-kpi-card>
        
        <app-kpi-card 
          title="Categoría Principal" 
          [value]="stats().categoriaPrincipal" 
          subtext="Mayor variedad de ítems" 
          type="category">
        </app-kpi-card>
      </div>

      <!-- Gráficos -->
      <div class="charts-grid">
        <div class="chart-card bar-chart-container">
          <div class="chart-header">
            <h4>Distribución de Stock por Categoría</h4>
            <span class="sub">Unidades de suministros por departamento</span>
          </div>
          <div class="chart-body">
            <canvas #barChartCanvas></canvas>
          </div>
        </div>

        <div class="chart-card pie-chart-container">
          <div class="chart-header">
            <h4>Requisito de Rango Ninja</h4>
            <span class="sub">Variedad de suministros autorizados por nivel</span>
          </div>
          <div class="chart-body">
            <canvas #pieChartCanvas></canvas>
          </div>
        </div>

        <div class="chart-card radar-chart-container">
          <div class="chart-header">
            <h4>Análisis de Perfil de Inventario</h4>
            <span class="sub">Stock promedio vs. Costo promedio por categoría</span>
          </div>
          <div class="chart-body">
            <canvas #radarChartCanvas></canvas>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.25rem;
    }

    .chart-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      min-height: 320px;
    }

    .bar-chart-container {
      grid-column: span 1;
    }

    .pie-chart-container {
      grid-column: span 1;
    }

    .radar-chart-container {
      grid-column: span 2;
      min-height: 380px;
    }

    /* Responsive charts grid */
    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
      .radar-chart-container {
        grid-column: span 1;
      }
    }

    .chart-header {
      margin-bottom: 1.25rem;
      border-left: 3px solid var(--color-primary);
      padding-left: 0.75rem;
    }

    .chart-header h4 {
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .chart-header .sub {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .chart-body {
      position: relative;
      flex-grow: 1;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    canvas {
      width: 100% !important;
      height: 100% !important;
      max-height: 320px;
    }
  `]
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  private readonly inventarioService = inject(InventarioService);

  // Obtener estadísticas reactivas del servicio
  public stats = this.inventarioService.stats;

  // Canvas ViewChild references
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('radarChartCanvas') radarChartCanvas!: ElementRef<HTMLCanvasElement>;

  // Chart references
  private barChart?: Chart;
  private pieChart?: Chart;
  private radarChart?: Chart;

  constructor() {
    // Escuchar cambios en la señal de suministros para actualizar los gráficos en tiempo real
    effect(() => {
      const suministros = this.inventarioService.suministros();
      this.updateChartsData(suministros);
    });
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  ngOnDestroy() {
    // Destruir gráficos al destruir el componente para evitar fugas de memoria
    this.barChart?.destroy();
    this.pieChart?.destroy();
    this.radarChart?.destroy();
  }

  private initCharts() {
    const list = this.inventarioService.suministros();

    // 1. Gráfico de Barras: Distribución de Stock por Categoría
    const barCtx = this.barChartCanvas.nativeElement.getContext('2d');
    if (barCtx) {
      this.barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: ['Armamento', 'Médico', 'Sigilo', 'Herramientas'],
          datasets: [{
            label: 'Stock Total',
            data: this.calculateStockByCategory(list),
            backgroundColor: [
              'rgba(204, 0, 0, 0.7)',    // Armamento - Crimson
              'rgba(16, 185, 129, 0.7)',  // Médico - Green
              'rgba(139, 92, 246, 0.7)',  // Sigilo - Purple
              'rgba(245, 158, 11, 0.7)'   // Herramientas - Orange
            ],
            borderColor: [
              '#cc0000',
              '#10b981',
              '#8b5cf6',
              '#f59e0b'
            ],
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#15151a',
              titleColor: '#fff',
              bodyColor: '#e5e7eb',
              borderColor: '#23232b',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#9ca3af' }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#9ca3af' },
              beginAtZero: true
            }
          }
        }
      });
    }

    // 2. Gráfico de Sectores (Pie): Distribución por Rango
    const pieCtx = this.pieChartCanvas.nativeElement.getContext('2d');
    if (pieCtx) {
      this.pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
          labels: ['Genin', 'Chunin', 'Jonin', 'Anbu'],
          datasets: [{
            data: this.calculateCountByRank(list),
            backgroundColor: [
              'rgba(16, 185, 129, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(139, 92, 246, 0.7)'
            ],
            borderColor: '#15151a',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#9ca3af',
                font: { size: 11, family: 'Inter' },
                boxWidth: 12
              }
            },
            tooltip: {
              backgroundColor: '#15151a',
              borderColor: '#23232b',
              borderWidth: 1
            }
          }
        }
      });
    }

    // 3. Gráfico de Radar: Perfil de Inventario (Stock vs Precio Promedio)
    const radarCtx = this.radarChartCanvas.nativeElement.getContext('2d');
    if (radarCtx) {
      const radarData = this.calculateRadarStats(list);
      this.radarChart = new Chart(radarCtx, {
        type: 'radar',
        data: {
          labels: ['Armamento', 'Médico', 'Sigilo', 'Herramientas'],
          datasets: [
            {
              label: 'Stock Promedio (Uds)',
              data: radarData.avgStock,
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: '#3b82f6',
              pointBackgroundColor: '#3b82f6',
              pointBorderColor: '#fff',
              borderWidth: 2
            },
            {
              label: 'Precio Promedio (¥)',
              data: radarData.avgPrice,
              backgroundColor: 'rgba(204, 0, 0, 0.2)',
              borderColor: '#cc0000',
              pointBackgroundColor: '#cc0000',
              pointBorderColor: '#fff',
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#9ca3af', font: { size: 11 } }
            },
            tooltip: {
              backgroundColor: '#15151a',
              borderColor: '#23232b',
              borderWidth: 1
            }
          },
          scales: {
            r: {
              angleLines: { color: 'rgba(255, 255, 255, 0.07)' },
              grid: { color: 'rgba(255, 255, 255, 0.07)' },
              pointLabels: {
                color: '#9ca3af',
                font: { size: 11, weight: 'bold' }
              },
              ticks: {
                backdropColor: 'transparent',
                color: '#6b7280',
                font: { size: 9 }
              },
              suggestedMin: 0
            }
          }
        }
      });
    }
  }

  private updateChartsData(suministros: Suministro[]) {
    if (this.barChart) {
      this.barChart.data.datasets[0].data = this.calculateStockByCategory(suministros);
      this.barChart.update();
    }

    if (this.pieChart) {
      this.pieChart.data.datasets[0].data = this.calculateCountByRank(suministros);
      this.pieChart.update();
    }

    if (this.radarChart) {
      const radarData = this.calculateRadarStats(suministros);
      this.radarChart.data.datasets[0].data = radarData.avgStock;
      this.radarChart.data.datasets[1].data = radarData.avgPrice;
      this.radarChart.update();
    }
  }

  // Calculadoras Auxiliares
  private calculateStockByCategory(list: Suministro[]): number[] {
    const categories: ('Armamento' | 'Médico' | 'Sigilo' | 'Herramientas')[] = ['Armamento', 'Médico', 'Sigilo', 'Herramientas'];
    return categories.map(cat => 
      list.filter(s => s.categoria === cat).reduce((acc, s) => acc + s.stock, 0)
    );
  }

  private calculateCountByRank(list: Suministro[]): number[] {
    const ranks: ('Genin' | 'Chunin' | 'Jonin' | 'Anbu')[] = ['Genin', 'Chunin', 'Jonin', 'Anbu'];
    return ranks.map(r => list.filter(s => s.rangoRequerido === r).length);
  }

  private calculateRadarStats(list: Suministro[]) {
    const categories: ('Armamento' | 'Médico' | 'Sigilo' | 'Herramientas')[] = ['Armamento', 'Médico', 'Sigilo', 'Herramientas'];
    
    const avgStock = categories.map(cat => {
      const filtered = list.filter(s => s.categoria === cat);
      if (filtered.length === 0) return 0;
      return Math.round(filtered.reduce((acc, s) => acc + s.stock, 0) / filtered.length);
    });

    const avgPrice = categories.map(cat => {
      const filtered = list.filter(s => s.categoria === cat);
      if (filtered.length === 0) return 0;
      return Math.round(filtered.reduce((acc, s) => acc + s.precioUnitario, 0) / filtered.length);
    });

    return { avgStock, avgPrice };
  }
}
