export interface Suministro {
  id: string;
  nombre: string;
  categoria: 'Armamento' | 'Médico' | 'Sigilo' | 'Herramientas';
  stock: number;
  precioUnitario: number;
  rangoRequerido: 'Genin' | 'Chunin' | 'Jonin' | 'Anbu';
  ultimaActualizacion: string; // Formato ISO
}

export const SUMINISTROS_MOCK: Suministro[] = [
  { id: 'S001', nombre: 'Kunai de Acero', categoria: 'Armamento', stock: 150, precioUnitario: 15, rangoRequerido: 'Genin', ultimaActualizacion: '2024-03-01' },
  { id: 'S002', nombre: 'Píldoras de Soldado', categoria: 'Médico', stock: 8, precioUnitario: 50, rangoRequerido: 'Chunin', ultimaActualizacion: '2024-03-05' },
  { id: 'S003', nombre: 'Bomba de Humo', categoria: 'Sigilo', stock: 120, precioUnitario: 25, rangoRequerido: 'Anbu', ultimaActualizacion: '2024-03-02' },
  { id: 'S004', nombre: 'Pergamino de Sellado', categoria: 'Herramientas', stock: 5, precioUnitario: 200, rangoRequerido: 'Jonin', ultimaActualizacion: '2024-03-08' },
  { id: 'S005', nombre: 'Shuriken Gigante', categoria: 'Armamento', stock: 45, precioUnitario: 80, rangoRequerido: 'Chunin', ultimaActualizacion: '2024-03-04' },
  { id: 'S006', nombre: 'Ungüento Curativo', categoria: 'Médico', stock: 3, precioUnitario: 120, rangoRequerido: 'Genin', ultimaActualizacion: '2024-03-07' },
  { id: 'S007', nombre: 'Capa de Invisibilidad', categoria: 'Sigilo', stock: 12, precioUnitario: 500, rangoRequerido: 'Anbu', ultimaActualizacion: '2024-03-01' }
];
