import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { DbStorageService } from 'src/app/services/db-storage.service';
import type { OverlayEventDetail } from '@ionic/core';

@Component({
  selector: 'app-pictures',
  templateUrl: './pictures.page.html',
  styleUrls: ['./pictures.page.scss'],
  standalone: false
})
export class PicturesPage implements OnInit {
  data:any = {};
  datos:any = {};

  constructor(private db:DbStorageService, private toastCtrl:ToastController) { }

  async ngOnInit() {
    await this.loadData();
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    this.datos = await this.db.getData();
    console.log(this.datos.rows);
  }

  async remove(data:any){
    let res = await this.db.removeData(data);
    this.datos = await this.db.getData();
    console.log(res);
  }

  confirmDelete(data: any) {
    this.data = data;
    const alert = document.createElement('ion-alert');
    alert.header = 'Confirmar eliminación';
    alert.message = '¿Estás seguro que deseas eliminar esta foto?';
    alert.buttons = [
      {
        text: 'Cancelar',
        role: 'cancel',
        handler: () => {
          console.log('Eliminación cancelada');
          this.presentToast('Acción cancelada', 'top', 'danger');
        },
      },
      {
        text: 'Confirmar',
        role: 'confirm',
        handler: () => {
          this.remove(data);
          this.presentToast('Foto eliminada', 'top', 'success');
        },
      },
    ];

    document.body.appendChild(alert);
    alert.present();
  }

  setResult(event: CustomEvent<OverlayEventDetail>) {
    console.log(`Dismissed with role: ${event.detail.role}`);
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
