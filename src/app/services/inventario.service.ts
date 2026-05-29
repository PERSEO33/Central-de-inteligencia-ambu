import { Injectable, signal, computed } from '@angular/core';
import { Suministro, SUMINISTROS_MOCK } from '../models/suministro.model';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  // Signal para almacenar la lista de suministros
  public suministros = signal<Suministro[]>(SUMINISTROS_MOCK);

  // Signal computada para calcular estadísticas reactivas
  public stats = computed(() => {
    const lista = this.suministros();
    const totalStock = lista.reduce((acc, s) => acc + s.stock, 0);
    const totalValor = lista.reduce((acc, s) => acc + (s.stock * s.precioUnitario), 0);
    const bajoStock = lista.filter(s => s.stock < 10).length;
    const categorias = lista.map(s => s.categoria);
    const categoriaPrincipal = categorias.length > 0 ? this.getMostFrequent(categorias) : 'Ninguna';

    return {
      totalStock,
      totalValor,
      bajoStock,
      categoriaPrincipal
    };
  });

  // Agregar suministro
  agregarSuministro(suministro: Suministro) {
    this.suministros.update(actuales => [...actuales, suministro]);
  }

  // Eliminar suministro
  eliminarSuministro(id: string) {
    this.suministros.update(actuales => actuales.filter(s => s.id !== id));
  }

  // Actualizar stock de un suministro específico
  actualizarStock(id: string, nuevoStock: number) {
    this.suministros.update(actuales =>
      actuales.map(s => s.id === id
        ? { ...s, stock: nuevoStock, ultimaActualizacion: new Date().toISOString().split('T')[0] }
        : s
      )
    );
  }

  // Actualizar un suministro completo
  actualizarSuministro(suministroActualizado: Suministro) {
    this.suministros.update(actuales =>
      actuales.map(s => s.id === suministroActualizado.id ? suministroActualizado : s)
    );
  }

  private getMostFrequent(arr: string[]): string {
    const counts = arr.reduce((acc: any, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }
}
