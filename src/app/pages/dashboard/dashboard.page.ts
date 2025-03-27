import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit, OnDestroy {
  mode: string = 'manual';
  esp32BaseUrl = 'http://192.168.18.62'
  isRoverOnline: boolean = false;
  private statusInterval: any;

  constructor(private router:Router, private http:HttpClient, private toastCtrl: ToastController) { }

  ngOnInit() {
    this.setInitialMode();
    this.checkRoverStatus();
    this.setupStatusChecker();
  }

  ngOnDestroy() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }

  private setupStatusChecker() {
    this.statusInterval = setInterval(() => {
      this.checkRoverStatus();
    }, 5000); 
  }

  private async checkRoverStatus() {
    try {
      await this.http.get(this.esp32BaseUrl + '/status', { responseType: 'text' }).subscribe({
        next: (res) => {
          this.presentToast('Rover conectado', 'top', 'success');
          this.isRoverOnline = true;
        },
        error: (err) => {
          this.presentToast('Rover no detectado', 'top', 'danger');
          console.error('Error al verificar el estado del rover:', err);  
          this.isRoverOnline = false;
        }
      });
      
    } catch (error) {
      this.isRoverOnline = false;
    }
  }

  setInitialMode() {
    if (this.isRoverOnline) {
      this.http.get(`${this.esp32BaseUrl}/set_mode?mode=manual`).subscribe();
    }
  }

  onModeChange(mode: string) {
    if (!this.isRoverOnline) {
      this.presentToast('Rover desconectado', 'top', 'danger');
      return;
    }

    this.http.get(`${this.esp32BaseUrl}/set_mode?mode=${mode}`).subscribe({
      next: () => {
        this.mode = mode;
        this.presentToast('Modo cambiado a ' + mode, 'top', 'warning');
      },
      error: (err) => {
        console.error('Error cambiando modo:', err);
        this.presentToast('Error cambiando de modo', 'top', 'danger');
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

  async presentToast(message: string, position: 'bottom' | 'top' | 'middle', color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 1500,
      position: position,
      color: color
    });
    await toast.present();
  }

}
