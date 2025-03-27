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

  async saveData(data:any){
    return await this.db.post(data);
  }

  async getData(){
    return await this.db.allDocs({include_docs: true});
  }

  async filter(filter:string){
    console.log(filter)
    return this.db.find({
      selector:{
        type:filter && filter != 'all' ? filter : {$gt:null}
      }
    })
  }

  async removeData(data:any){
    return await this.db.remove(data);
  }

}
