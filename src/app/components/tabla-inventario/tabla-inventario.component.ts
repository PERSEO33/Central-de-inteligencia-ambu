import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';
import { Suministro } from '../../models/suministro.model';

@Component({
  selector: 'app-tabla-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tabla-container">
      <!-- Barra de herramientas superior -->
      <div class="tabla-toolbar">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="search-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
          </svg>
          <input 
            type="text" 
            placeholder="Buscar por ID o Nombre de Suministro..." 
            [ngModel]="searchTerm()"
            (ngModelChange)="onSearchChange($event)" />
        </div>

        <div class="toolbar-actions">
          <button (click)="toggleAdvancedFilters()" [class.active]="showAdvanced()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Filtros Ninja {{ showAdvanced() ? '▲' : '▼' }}
          </button>
          
          <button (click)="resetFilters()" class="btn-clear">
            Restablecer Filtros
          </button>
        </div>
      </div>

      <!-- Filtros avanzados colapsables (Consejo de Ninja) -->
      <div class="advanced-filters" [class.show]="showAdvanced()">
        <div class="filters-grid">
          <!-- Categoría -->
          <div class="filter-group">
            <label>Categoría</label>
            <select [ngModel]="selectedCategoria()" (ngModelChange)="selectedCategoria.set($event); resetPage()">
              <option value="Todas">Todas</option>
              <option value="Armamento">Armamento</option>
              <option value="Médico">Médico</option>
              <option value="Sigilo">Sigilo</option>
              <option value="Herramientas">Herramientas</option>
            </select>
          </div>

          <!-- Rango Ninja -->
          <div class="filter-group">
            <label>Rango Requerido</label>
            <select [ngModel]="selectedRango()" (ngModelChange)="selectedRango.set($event); resetPage()">
              <option value="Todos">Todos</option>
              <option value="Genin">Genin</option>
              <option value="Chunin">Chunin</option>
              <option value="Jonin">Jonin</option>
              <option value="Anbu">Anbu</option>
            </select>
          </div>

          <!-- Stock Crítico Toggle -->
          <div class="filter-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" [ngModel]="onlyBajoStock()" (ngModelChange)="onlyBajoStock.set($event); resetPage()" />
              <span>Solo Stock Crítico (< 10)</span>
            </label>
          </div>

          <!-- Filtro de Rango: Stock -->
          <div class="filter-group range-group">
            <label>Rango de Stock: {{ minStock() }} - {{ maxStock() }} uds</label>
            <div class="range-sliders">
              <input type="range" min="0" max="500" [ngModel]="minStock()" (ngModelChange)="minStock.set($event); resetPage()" />
              <input type="range" min="0" max="500" [ngModel]="maxStock()" (ngModelChange)="maxStock.set($event); resetPage()" />
            </div>
          </div>

          <!-- Filtro de Rango: Precio -->
          <div class="filter-group range-group">
            <label>Precio Unitario: {{ minPrice() }}¥ - {{ maxPrice() }}¥</label>
            <div class="range-sliders">
              <input type="range" min="0" max="1000" [ngModel]="minPrice()" (ngModelChange)="minPrice.set($event); resetPage()" />
              <input type="range" min="0" max="1000" [ngModel]="maxPrice()" (ngModelChange)="maxPrice.set($event); resetPage()" />
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla principal -->
      <div class="table-wrapper">
        <table class="anbu-table">
          <thead>
            <tr>
              <th (click)="changeSort('id')" class="sortable">
                ID <span class="sort-indicator">{{ getSortIndicator('id') }}</span>
              </th>
              <th (click)="changeSort('nombre')" class="sortable">
                Nombre <span class="sort-indicator">{{ getSortIndicator('nombre') }}</span>
              </th>
              <th (click)="changeSort('categoria')" class="sortable">
                Categoría <span class="sort-indicator">{{ getSortIndicator('categoria') }}</span>
              </th>
              <th (click)="changeSort('stock')" class="sortable numeric">
                Stock <span class="sort-indicator">{{ getSortIndicator('stock') }}</span>
              </th>
              <th (click)="changeSort('precioUnitario')" class="sortable numeric">
                Precio Unitario <span class="sort-indicator">{{ getSortIndicator('precioUnitario') }}</span>
              </th>
              <th (click)="changeSort('rangoRequerido')" class="sortable">
                Autorización <span class="sort-indicator">{{ getSortIndicator('rangoRequerido') }}</span>
              </th>
              <th (click)="changeSort('ultimaActualizacion')" class="sortable">
                Última Act. <span class="sort-indicator">{{ getSortIndicator('ultimaActualizacion') }}</span>
              </th>
              <th class="actions-header">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of paginatedSuministros(); trackBy: trackById" 
                [class.stock-critico]="s.stock < 10">
              <td class="id-cell font-display">{{ s.id }}</td>
              <td class="name-cell">{{ s.nombre }}</td>
              <td>{{ s.categoria }}</td>
              <td class="numeric">
                <!-- Stock con control de edición rápida -->
                <div class="stock-editor">
                  <button class="stock-btn" (click)="adjustStock(s, -1)">-</button>
                  <input 
                    type="number" 
                    [value]="s.stock" 
                    (change)="updateStock(s.id, $event)" 
                    class="stock-input" 
                    min="0" />
                  <button class="stock-btn" (click)="adjustStock(s, 1)">+</button>
                </div>
              </td>
              <td class="numeric font-display">{{ s.precioUnitario }}¥</td>
              <td>
                <span class="badge" [ngClass]="'badge-' + s.rangoRequerido.toLowerCase()">
                  {{ s.rangoRequerido }}
                </span>
              </td>
              <td class="date-cell">{{ s.ultimaActualizacion }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon btn-danger" (click)="deleteSupply(s.id)" title="Eliminar Suministro">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="paginatedSuministros().length === 0">
              <td colspan="8" class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="empty-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No se encontraron manifiestos ninja coincidentes.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="tabla-pagination">
        <span class="pagination-info">
          Mostrando {{ getFirstIndex() }} - {{ getLastIndex() }} de {{ totalFiltered() }} suministros
        </span>

        <div class="pagination-controls">
          <div class="page-size-selector">
            <label>Filas por página:</label>
            <select [ngModel]="pageSize()" (ngModelChange)="pageSize.set($event); resetPage()">
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="20">20</option>
            </select>
          </div>

          <div class="page-buttons">
            <button [disabled]="currentPage() === 1" (click)="changePage(-1)">
              Anterior
            </button>
            <span class="page-indicator">Página {{ currentPage() }} de {{ totalPages() }}</span>
            <button [disabled]="currentPage() === totalPages()" (click)="changePage(1)">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tabla-container {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    /* Barra de herramientas */
    .tabla-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      background: rgba(21, 21, 26, 0.5);
    }

    .search-box {
      position: relative;
      flex-grow: 1;
      max-width: 480px;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      color: var(--color-text-muted);
      pointer-events: none;
    }

    .search-box input {
      width: 100%;
      padding-left: 2.25rem;
    }

    .toolbar-actions {
      display: flex;
      gap: 0.75rem;
    }

    .toolbar-actions button.active {
      background: var(--color-primary-glow);
      border-color: var(--color-primary);
      color: #fff;
    }

    .btn-clear {
      color: var(--color-text-muted);
    }

    .btn-clear:hover {
      color: #fff;
    }

    /* Filtros avanzados */
    .advanced-filters {
      max-height: 0;
      overflow: hidden;
      transition: all var(--transition-normal);
      background: var(--bg-surface);
      border-bottom: 0 solid var(--border-color);
    }

    .advanced-filters.show {
      max-height: 300px;
      border-bottom: 1px solid var(--border-color);
      padding: 1.25rem;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .filter-group label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }

    .filter-group select, .filter-group input[type="text"] {
      width: 100%;
    }

    .checkbox-group {
      flex-direction: row;
      align-items: center;
      height: 38px;
    }

    .checkbox-label {
      flex-direction: row !important;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      text-transform: none !important;
      font-size: 0.85rem !important;
      color: var(--color-text) !important;
    }

    .checkbox-label input {
      width: 16px;
      height: 16px;
      accent-color: var(--color-primary);
    }

    .range-group {
      min-width: 220px;
    }

    .range-sliders {
      display: flex;
      gap: 0.5rem;
    }

    .range-sliders input[type="range"] {
      flex-grow: 1;
      accent-color: var(--color-primary);
      background: var(--bg-card);
      height: 6px;
      border-radius: 3px;
      outline: none;
    }

    /* Tabla */
    .table-wrapper {
      overflow-x: auto;
    }

    .anbu-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }

    .anbu-table th {
      padding: 0.875rem 1.25rem;
      background: rgba(21, 21, 26, 0.8);
      font-weight: 600;
      color: var(--color-text-muted);
      border-bottom: 2px solid var(--border-color);
      user-select: none;
    }

    .anbu-table th.sortable {
      cursor: pointer;
    }

    .anbu-table th.sortable:hover {
      color: #fff;
      background: var(--bg-card-hover);
    }

    .anbu-table td {
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      transition: background-color var(--transition-fast);
    }

    .anbu-table tbody tr:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    .numeric {
      text-align: right;
    }

    .font-display {
      font-family: var(--font-display);
      font-size: 0.85rem;
    }

    .id-cell {
      color: var(--color-primary-hover);
      font-weight: bold;
      letter-spacing: 0.05em;
    }

    .name-cell {
      font-weight: 500;
    }

    .date-cell {
      color: var(--color-text-muted);
      font-size: 0.8rem;
    }

    /* Stock Editor */
    .stock-editor {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      justify-content: flex-end;
    }

    .stock-btn {
      width: 24px;
      height: 24px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: bold;
    }

    .stock-input {
      width: 50px;
      text-align: center;
      padding: 0.15rem 0.25rem;
      font-family: var(--font-display);
      font-size: 0.85rem;
    }

    .stock-input::-webkit-outer-spin-button,
    .stock-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Acciones */
    .actions-header {
      text-align: center;
    }

    .anbu-table td:last-child {
      text-align: center;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-icon {
      padding: 0.35rem;
      border-radius: 4px;
      line-height: 0;
    }

    /* Paginación */
    .tabla-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-color);
      background: rgba(21, 21, 26, 0.5);
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .page-size-selector select {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .page-buttons {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-buttons button {
      padding: 0.35rem 0.75rem;
      font-size: 0.75rem;
    }

    .page-indicator {
      font-weight: 500;
      color: var(--color-text);
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 3rem 1.25rem !important;
      color: var(--color-text-muted);
    }

    .empty-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 0.75rem;
      opacity: 0.4;
      color: var(--color-primary);
    }

    .sort-indicator {
      font-size: 0.7rem;
      margin-left: 0.25rem;
      color: var(--color-primary);
    }
  `]
})
export class TablaInventarioComponent {
  private readonly inventarioService = inject(InventarioService);

  // States controlled via Signals
  public searchTerm = signal<string>('');
  public selectedCategoria = signal<string>('Todas');
  public selectedRango = signal<string>('Todos');
  public onlyBajoStock = signal<boolean>(false);
  
  // Rango sliders limits (default bounds)
  public minStock = signal<number>(0);
  public maxStock = signal<number>(500);
  public minPrice = signal<number>(0);
  public maxPrice = signal<number>(1000);

  // Sorting
  public sortField = signal<string>('id');
  public sortAsc = signal<boolean>(true);

  // Pagination
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(10);

  // Toggle advanced filter panel
  public showAdvanced = signal<boolean>(false);

  // Compute filtered supplies
  public totalFiltered = computed(() => this.filteredSuministros().length);

  public filteredSuministros = computed(() => {
    const list = this.inventarioService.suministros();
    const search = this.searchTerm().toLowerCase().trim();
    const cat = this.selectedCategoria();
    const rank = this.selectedRango();
    const lowStock = this.onlyBajoStock();
    const minS = this.minStock();
    const maxS = this.maxStock();
    const minP = this.minPrice();
    const maxP = this.maxPrice();

    return list.filter(s => {
      const matchSearch = s.nombre.toLowerCase().includes(search) || s.id.toLowerCase().includes(search);
      const matchCat = cat === 'Todas' || s.categoria === cat;
      const matchRank = rank === 'Todos' || s.rangoRequerido === rank;
      const matchLowStock = !lowStock || s.stock < 10;
      const matchStock = s.stock >= minS && s.stock <= maxS;
      const matchPrice = s.precioUnitario >= minP && s.precioUnitario <= maxP;

      return matchSearch && matchCat && matchRank && matchLowStock && matchStock && matchPrice;
    });
  });

  // Compute sorted supplies
  public sortedSuministros = computed(() => {
    const list = [...this.filteredSuministros()];
    const field = this.sortField();
    const asc = this.sortAsc();

    return list.sort((a: any, b: any) => {
      let valA = a[field];
      let valB = b[field];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });
  });

  // Compute paginated supplies
  public paginatedSuministros = computed(() => {
    const list = this.sortedSuministros();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  // Compute total pages
  public totalPages = computed(() => {
    const count = this.totalFiltered();
    const size = this.pageSize();
    return Math.ceil(count / size) || 1;
  });

  // Toggle advanced filter collapse
  toggleAdvancedFilters() {
    this.showAdvanced.update(v => !v);
  }

  // Update search query
  onSearchChange(val: string) {
    this.searchTerm.set(val);
    this.resetPage();
  }

  // Reset all filters
  resetFilters() {
    this.searchTerm.set('');
    this.selectedCategoria.set('Todas');
    this.selectedRango.set('Todos');
    this.onlyBajoStock.set(false);
    this.minStock.set(0);
    this.maxStock.set(500);
    this.minPrice.set(0);
    this.maxPrice.set(1000);
    this.resetPage();
  }

  // Reset page to 1
  resetPage() {
    this.currentPage.set(1);
  }

  // Handle sorting
  changeSort(field: string) {
    if (this.sortField() === field) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(true);
    }
    this.resetPage();
  }

  // Get arrow indicators for sorting
  getSortIndicator(field: string): string {
    if (this.sortField() !== field) return '';
    return this.sortAsc() ? '▲' : '▼';
  }

  // Change current page
  changePage(dir: number) {
    const nextPage = this.currentPage() + dir;
    if (nextPage >= 1 && nextPage <= this.totalPages()) {
      this.currentPage.set(nextPage);
    }
  }

  // Pagination details
  getFirstIndex(): number {
    if (this.totalFiltered() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  getLastIndex(): number {
    const last = this.currentPage() * this.pageSize();
    const total = this.totalFiltered();
    return last > total ? total : last;
  }

  // Inline stock adjustment buttons
  adjustStock(suministro: Suministro, amount: number) {
    const newStock = Math.max(0, suministro.stock + amount);
    this.inventarioService.actualizarStock(suministro.id, newStock);
  }

  // Direct input change for stock
  updateStock(id: string, event: any) {
    const val = Number(event.target.value);
    if (!isNaN(val) && val >= 0) {
      this.inventarioService.actualizarStock(id, val);
    }
  }

  // Delete supply
  deleteSupply(id: string) {
    if (confirm('¿Está seguro de eliminar este manifiesto de suministro?')) {
      this.inventarioService.eliminarSuministro(id);
    }
  }

  trackById(index: number, item: Suministro): string {
    return item.id;
  }
}
