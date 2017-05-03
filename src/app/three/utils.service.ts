import { Injectable } from '@angular/core';

@Injectable()
export class UtilsService {

  constructor() { }

  public randomIntFromInterval(min, max) {
      return Math.floor(Math.random() * ( max - min + 1 ) + min);
  }

}
