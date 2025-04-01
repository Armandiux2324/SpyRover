import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb'; 
import PouchFind from 'pouchdb-find'; 
PouchDB.plugin(PouchFind);

@Injectable({
  providedIn: 'root'
})
export class DbStorageService {
  private db:any;

  constructor() { 
    this.db = new PouchDB('spyRover');
  }

  //Guardar las capturas en la base de datos
  async saveData(data:any){
    return await this.db.post(data);
  }

  //Obtener las capturas de la base de datos
  async getData(){
    return await this.db.allDocs({include_docs: true});
  }


  //Filtro por tipo de fotografía (persona, cualquiera)
  async filter(filter:string){
    console.log(filter)
    return this.db.find({
      selector:{
        type:filter && filter != 'all' ? filter : {$gt:null}
      }
    })
  }

  //Eliminar una captura de la base de datos
  async removeData(data:any){
    return await this.db.remove(data);
  }

}
