import { Component, AfterViewInit, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as nipplejs from 'nipplejs';
import { Router } from '@angular/router';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { HttpClient } from '@angular/common/http'; // Importar HttpClient
import { DbStorageService } from 'src/app/services/db-storage.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-control',
  templateUrl: './control.page.html',
  styleUrls: ['./control.page.scss'],
  standalone: false
})
export class ControlPage implements AfterViewInit, OnDestroy, OnInit {
  esp32CamIP: string = 'http://192.168.18.143';
  videoStreamUrl: string = this.esp32CamIP + ':81/stream';
  leftJoystick: any;
  rightJoystick: any;
  esp32IP: string = 'http://192.168.18.62';
  lastCommand: string = 'stop';
  distancia: number = 0.0;
  private distanceInterval: any;
  private isDestroyed = false;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  detectionActive = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private db: DbStorageService,
    private toastCtrl: ToastController,
  ) {
    
  }

  async ngOnInit() {
    this.setupVideo();
  }

  async ionViewWillEnter() {
    await ScreenOrientation.lock({ orientation: 'landscape' });
  }

  async ionViewWillLeave() {
    await ScreenOrientation.unlock();
    await ScreenOrientation.lock({ orientation: 'portrait' });
  }

  setupVideo() {
    this.videoElement.nativeElement.src = `${this.esp32CamIP}:81/stream`;
  }

  async showAlert(count: number) {

    const alert = document.createElement('ion-alert');
    alert.header = 'Alerta de seguridad';
    alert.message = `Se detectaron ${count} personas no autorizadas`;
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    await alert.present();
  }

  ngAfterViewInit() {
    this.setupJoysticks();
    this.startDistanceUpdates();
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.distanceInterval) {
      clearInterval(this.distanceInterval);
    }
    this.detectionActive = false;
  }

  startDistanceUpdates() {
    this.distanceInterval = setInterval(() => {
      if (!this.isDestroyed) {
        this.getDistance();
      }
    }, 500); 
  }

  getDistance() {
    const endpoint = `${this.esp32IP}/distance`;
    this.http.get(endpoint, { responseType: 'text' }).subscribe({
      next: (distance) => {
        this.distancia = Math.round(parseFloat(distance) || 0);
      },
      error: (err) => {
        console.error('Error obteniendo distancia:', err);
        this.distancia = -1; // Valor de error
      }
    });
  }

  setupJoysticks() {
    const leftZone = document.getElementById('joystick-left');
    if (leftZone) {
      this.leftJoystick = nipplejs.create({
        zone: leftZone,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'blue',
        size: 120,
      });

      this.leftJoystick.on('move', (evt: any, data: any) => {
        this.handleMovement(data);
      });

      this.leftJoystick.on('end', () => {
        this.sendCommand('stop');
      });
    }

    // Configuración joystick derecho (cámara/giro)
    const rightZone = document.getElementById('joystick-right');
    if (rightZone) {
      this.rightJoystick = nipplejs.create({
        zone: rightZone,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'red',
        size: 120,
      });

      this.rightJoystick.on('move', (evt: any, data: any) => {
        this.handleSteering(data);
      });
    }
  }

  handleMovement(data: any) {
    const angle = data.angle.degree;
    const force = data.force;

    let command = 'stop';

    if (force > 0.3) {
      if (angle >= 315 || angle <= 45) { // derecha
        command = 'right';
      } else if (angle >= 135 && angle <= 225) { // izquierda
        command = 'left';
      } else if (angle > 45 && angle < 135) { // Adelante
        command = 'forward';
      } else if (angle > 225 && angle < 315) { // atrás
        command = 'backward';
      } else {
        command = 'stop';
      }
    }

    if (command !== this.lastCommand) {
      this.sendCommand(command);
      this.lastCommand = command;
    }
  }

  handleSteering(data: any) {
    const angle = data.angle.degree;
  
    let servoCommand = '';
  
    if (angle >= 315 || angle <= 45) { // Derecha máxima
      servoCommand = 'servo_right';
    } else if (angle >= 135 && angle <= 225) { // Izquierda máxima
      servoCommand = 'servo_left';
    } else if ((angle > 45 && angle < 135) || (angle > 225 && angle < 315)) { // Centro
      servoCommand = 'servo_center';
    }
  
    if (servoCommand) {
      this.sendServoCommand(servoCommand);
    }
  }
  
  sendServoCommand(command: string) {
    const endpoint = `${this.esp32IP}/${command}`;
    this.http.get(endpoint).subscribe({
      next: () => console.log(`Comando al servo ${command} enviado`),
      error: (err) => console.error('Error enviando comando al servo:', err)
    });
  }
  

  sendCommand(command: string) {
    const endpoint = `${this.esp32IP}/${command}`;
    this.http.get(endpoint).subscribe({
      next: () => console.log(`Comando ${command} enviado`),
      error: (err) => console.error('Error enviando comando:', err)
    });
  }

  async save(data: any) {
    let res = await this.db.saveData(data);
    console.log(res);
    if (res.ok) {
      this.presentToast('Captura guardada.', 'top', 'success');
    } else {
      this.presentToast('Error al guardar', 'top', 'danger')

    }
  }

  capturePhoto() {
    console.log('URL de la cámara:', this.videoStreamUrl);
    const snapshotUrl = this.esp32CamIP + '/capture';
    this.http.get(snapshotUrl, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result; 
          const doc = {
            type: 'photo',
            image: base64data,
            timestamp: new Date().toISOString()
          };
          this.save(doc);
        };
        reader.readAsDataURL(blob);
      },
      error: (err) => {
        console.error("Error capturando la foto:", err);
        this.presentToast('Error al capturar foto', 'top', 'danger');
      }
    });
  }

  async onUnrecognizedFace(){
    this.presentToast('Persona no autorizada detectada', 'top', 'danger');
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
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