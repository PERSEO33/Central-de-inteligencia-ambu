import { Component, inject, signal } from '@angular/core';
import { InventarioService } from './services/inventario.service';
import { Suministro } from './models/suministro.model';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'anbu-app';
  public inventarioService = inject(InventarioService);

  // Estados del Formulario y UI
  showForm = signal<boolean>(false);
  mensajeHUD = signal<string>('');
  tipoMensajeHUD = signal<'info' | 'success' | 'warning'>('info');

  // Propiedades del formulario
  nuevoId = '';
  nuevoNombre = '';
  nuevaCategoria: 'Armamento' | 'Médico' | 'Sigilo' | 'Herramientas' = 'Armamento';
  nuevoStock = 0;
  nuevoPrecio = 0;
  nuevoRango: 'Genin' | 'Chunin' | 'Jonin' | 'Anbu' = 'Genin';

  // Mostrar mensaje temporal en el HUD táctico
  mostrarHUD(mensaje: string, tipo: 'info' | 'success' | 'warning' = 'info') {
    this.mensajeHUD.set(mensaje);
    this.tipoMensajeHUD.set(tipo);
    setTimeout(() => {
      if (this.mensajeHUD() === mensaje) {
        this.mensajeHUD.set('');
      }
    }, 4000);
  }

  // Alternar formulario
  toggleForm() {
    this.showForm.update(v => !v);
    if (this.showForm()) {
      // Generar ID sugerido secuencial
      const supplies = this.inventarioService.suministros();
      const numIds = supplies.map(s => parseInt(s.id.substring(1))).filter(n => !isNaN(n));
      const nextNum = numIds.length > 0 ? Math.max(...numIds) + 1 : 1;
      this.nuevoId = 'S' + String(nextNum).padStart(3, '0');
    }
  }

  // Registrar suministro
  registrarSuministro() {
    if (!this.nuevoId || !this.nuevoNombre || this.nuevoStock < 0 || this.nuevoPrecio < 0) {
      this.mostrarHUD('Error: Campos inválidos o vacíos en el manifiesto.', 'warning');
      return;
    }

    // Validar duplicado
    const existe = this.inventarioService.suministros().some(s => s.id === this.nuevoId);
    if (existe) {
      this.mostrarHUD(`Error: El ID ${this.nuevoId} ya existe en los registros.`, 'warning');
      return;
    }

    const nuevo: Suministro = {
      id: this.nuevoId,
      nombre: this.nuevoNombre,
      categoria: this.nuevaCategoria,
      stock: this.nuevoStock,
      precioUnitario: this.nuevoPrecio,
      rangoRequerido: this.nuevoRango,
      ultimaActualizacion: new Date().toISOString().split('T')[0]
    };

    this.inventarioService.agregarSuministro(nuevo);
    this.mostrarHUD(`Suministro registrado con éxito: [${nuevo.id}] ${nuevo.nombre}`, 'success');

    // Resetear formulario
    this.nuevoNombre = '';
    this.nuevoStock = 0;
    this.nuevoPrecio = 0;
    this.nuevoRango = 'Genin';
    this.nuevaCategoria = 'Armamento';
    this.showForm.set(false);
  }

  // Simular consumo de suministros por misión S-Rank
  simularConsumoMision() {
    const supplies = this.inventarioService.suministros();
    const itemsDisponibles = supplies.filter(s => s.stock > 0);
    
    if (itemsDisponibles.length === 0) {
      this.mostrarHUD('Imposible iniciar misión: Arsenal completamente agotado.', 'warning');
      return;
    }

    // Seleccionar uno al azar
    const idx = Math.floor(Math.random() * itemsDisponibles.length);
    const item = itemsDisponibles[idx];
    const consumo = Math.min(item.stock, Math.floor(Math.random() * 5) + 1);
    
    this.inventarioService.actualizarStock(item.id, item.stock - consumo);
    this.mostrarHUD(`Misión de Rango S ejecutada. Consumido: ${consumo} uds de "${item.nombre}".`, 'info');
  }

  // Reabastecer stock crítico
  reabastecerCriticos() {
    const supplies = this.inventarioService.suministros();
    const criticos = supplies.filter(s => s.stock < 10);

    if (criticos.length === 0) {
      this.mostrarHUD('Todos los suministros están en niveles nominales seguros.', 'info');
      return;
    }

    criticos.forEach(s => {
      // Reabastecer a un stock nominal estándar (ej. 50 unidades)
      this.inventarioService.actualizarStock(s.id, 50);
    });

    this.mostrarHUD(`Reabastecimiento completado. ${criticos.length} suministros críticos restaurados a 50 unidades.`, 'success');
  }

  // Exportar Excel
  exportarExcel() {
    const data = this.inventarioService.suministros();
    
    // Mapear claves a nombres legibles para el reporte
    const dataMapeada = data.map(s => ({
      'ID Suministro': s.id,
      'Nombre': s.nombre,
      'Categoría': s.categoria,
      'Stock Actual': s.stock,
      'Precio Unitario (JPY)': s.precioUnitario,
      'Valor del Lote (JPY)': s.stock * s.precioUnitario,
      'Autorización Requerida': s.rangoRequerido,
      'Fecha de Registro': s.ultimaActualizacion
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataMapeada);
    
    // Auto-ajustar ancho de columnas para legibilidad
    const maxLen = dataMapeada.reduce((acc: any, row: any) => {
      Object.keys(row).forEach((key, colIndex) => {
        const valueLength = String(row[key]).length;
        const keyLength = key.length;
        const currentMax = acc[colIndex] || 0;
        acc[colIndex] = Math.max(currentMax, valueLength, keyLength);
      });
      return acc;
    }, []);
    worksheet['!cols'] = maxLen.map((len: number) => ({ wch: len + 3 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suministros ANBU');
    
    XLSX.writeFile(workbook, 'Reporte_ANBU_Suministros.xlsx');
    this.mostrarHUD('Hoja de cálculo Excel exportada correctamente.', 'success');
  }

  // Exportar PDF
  exportarPDF() {
    const data = this.inventarioService.suministros();
    const doc = new jsPDF();

    // 1. Diseño estético de cabecera oficial ANBU
    doc.setFillColor(15, 15, 18);
    doc.rect(0, 0, 210, 40, 'F');

    // Línea de acento carmesí
    doc.setFillColor(204, 0, 0);
    doc.rect(0, 40, 210, 2, 'F');

    // Título y Metadatos en la cabecera
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CENTRAL DE INTELIGENCIA ANBU', 14, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('SISTEMA TÁCTICO DE MANIFIESTO DE SUMINISTROS', 14, 25);
    
    const fechaStr = new Date().toLocaleString();
    doc.text(`FECHA DE EMISIÓN: ${fechaStr}`, 14, 32);

    // 2. Tabla oficial
    const headers = [['ID', 'Suministro', 'Categoría', 'Stock', 'Precio Unitario', 'Valor Lote', 'Autorización']];
    const body = data.map(s => [
      s.id,
      s.nombre,
      s.categoria,
      s.stock,
      `${s.precioUnitario}¥`,
      `${s.stock * s.precioUnitario}¥`,
      s.rangoRequerido
    ]);

    autoTable(doc, {
      startY: 48,
      head: headers,
      body: body,
      theme: 'grid',
      headStyles: {
        fillColor: [204, 0, 0],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 50 },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'center' }
      },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    // 3. Firma y pie de página
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        'CONFIDENCIAL - USO EXCLUSIVO DEL CUARTEL GENERAL ANBU',
        14,
        285
      );
      doc.text(`Página ${i} de ${totalPages}`, 180, 285);
    }

    doc.save('Manifiesto_Suministros_ANBU.pdf');
    this.mostrarHUD('Manifiesto oficial PDF descargado.', 'success');
  }
}
