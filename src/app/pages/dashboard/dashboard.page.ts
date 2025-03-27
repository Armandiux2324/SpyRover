import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit {
  mode: string = 'manual';
  esp32BaseUrl = 'http://192.168.18.62'

  constructor(private router:Router, private http:HttpClient) { }

  ngOnInit() {
    this.setInitialMode();
  }

  setInitialMode() {
    this.http.get(`${this.esp32BaseUrl}/set_mode?mode=manual`).subscribe();
  }

  onModeChange(mode: string) {
    this.http.get(`${this.esp32BaseUrl}/set_mode?mode=${mode}`).subscribe({
      next: () => {
        console.log(`Modo cambiado a ${mode}`);
        // Forzar actualización visual
        this.mode = mode; 
      },
      error: (err) => {
        console.error('Error cambiando modo:', err);
        // Revertir cambio en caso de error
        this.mode = this.mode === 'manual' ? 'automatic' : 'manual'; 
      }
    });
  }

  saveChanges(){
    
  }

  redirectToControl(){
    this.router.navigate(['/control']);
  }

  redirectToPictures(){
    this.router.navigate(['/pictures']);
  }

  redirectToHistory(){
    this.router.navigate(['/history']);
  }

}
