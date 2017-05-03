import { Component } from '@angular/core';

import * as THREE from 'three';

const Detector = require('./three/Detector.js');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor() {
    if (Detector.webgl) {
      // ok
      console.log("OK");
    } else {
      let warning = Detector.getWebGLErrorMessage();
      document.getElementById('container').appendChild(warning);
      console.log("NOT OK");
    }
  }
}
