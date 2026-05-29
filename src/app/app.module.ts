import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TablaInventarioComponent } from './components/tabla-inventario/tabla-inventario.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardComponent,
    TablaInventarioComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
