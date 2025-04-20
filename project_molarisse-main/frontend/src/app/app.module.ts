import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

// Import du module Material partagé
import { MaterialModule } from './shared-material/material.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { PatientDashboardComponent } from './dashboard/patient-dashboard.component';
import { DoctorDashboardComponent } from './dashboard/doctor-dashboard.component';
import { SecretaireDashboardComponent } from './dashboard/secretaire-dashboard.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ApiInterceptor } from './core/interceptors/api-interceptor';
import { NotificationBellComponent } from './shared/components/notification-bell/notification-bell.component';
import { AppointmentListComponent } from './dashboard/shared/appointment-list/appointment-list.component';
import { BookAppointmentComponent } from './dashboard/shared/book-appointment/book-appointment.component';
import { ProfileWrapperComponent } from './shared/components/profile-wrapper/profile-wrapper.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    PatientDashboardComponent,
    DoctorDashboardComponent,
    SecretaireDashboardComponent,
    AdminDashboardComponent,
    NotificationBellComponent,
    AppointmentListComponent,
    BookAppointmentComponent,
    ProfileWrapperComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MaterialModule,
    CommonModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { } 