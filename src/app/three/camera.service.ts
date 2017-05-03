import { Injectable } from '@angular/core';

import * as THREE from 'three';

import {TweenMax, Power2} from 'gsap';

import { UtilsService } from '../three/utils.service';

@Injectable()
export class CameraService {

  private scene: THREE.Scene;

  public activeCamera: THREE.PerspectiveCamera;

  public camera1: THREE.PerspectiveCamera;
  public camera2: THREE.PerspectiveCamera;
  public camera3: THREE.PerspectiveCamera;

  public listener1 = new THREE.AudioListener();
  public listener2 = new THREE.AudioListener();
  public listener3 = new THREE.AudioListener();

  public get camera(): THREE.PerspectiveCamera {
    return this.activeCamera;
  }

  public cameraTarget: THREE.Vector3;

  private fieldOfView: number = 75;
  private nearClippingPane: number = 1;
  private farClippingPane: number = 1100;

  constructor(
    public utils: UtilsService
  ) {}

  public beforeIntro() {
    this.toCam1();
    this.camera1.fov = 200;
    this.update();
  }

  public intro() {
    TweenMax.to(this.camera1, 1, {fov: this.fieldOfView, delay: 0.5, onUpdate: () => {
      this.update();
    }});
  }

  public toCam1() {
    this.activeCamera = this.camera1;
    this.update();
  }

  public toCam2() {
    this.activeCamera = this.camera2;
    this.update();
  }

  public toCam3() {
    this.activeCamera = this.camera3;
    this.update();
  }

  public create(_scene: THREE.Scene, canvas: HTMLCanvasElement) {
    this.scene = _scene;

    // 1
    this.camera1 = new THREE.PerspectiveCamera(
      this.fieldOfView,
      canvas.clientWidth / canvas.clientHeight,
      this.nearClippingPane,
      this.farClippingPane
    );

    this.camera1.position.set( 0, 2, 2 );
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.camera1.lookAt(this.cameraTarget);
    this.camera1.add( this.listener1 );

    // 2
    this.camera2 = new THREE.PerspectiveCamera(
      this.fieldOfView,
      canvas.clientWidth / canvas.clientHeight,
      this.nearClippingPane,
      this.farClippingPane
    );

    this.camera2.position.set( 20, 5, -20 );
    //const camera2Target = new THREE.Vector3(-33, -35, -60);
    const camera2Target = new THREE.Vector3(0, 0, 0);
    this.camera2.lookAt(camera2Target);
    this.camera2.add( this.listener2 );

    // 3
    this.camera3 = new THREE.PerspectiveCamera(
      this.fieldOfView,
      canvas.clientWidth / canvas.clientHeight,
      this.nearClippingPane,
      this.farClippingPane
    );

    this.camera3.position.set( 15, -10, -40 );
    const camera3Target = new THREE.Vector3(-33, -35, -60);
    this.camera3.lookAt(camera3Target);
    this.camera3.add( this.listener3 );

    this.activeCamera = this.camera1;
  }

  public update() {
    this.activeCamera.updateProjectionMatrix();
  }

  public animate() {
    if (!this.camera.userData.hasOwnProperty('initialPosX')) {
      this.camera.userData.initialPosX = this.camera.position.x;
      this.camera.userData.initialPosY = this.camera.position.y;
      this.camera.userData.initialPosZ = this.camera.position.z;
    }
    const dist = 0.01;
    const xmin = this.camera.userData.initialPosX - dist;
    const xmax = this.camera.userData.initialPosX + dist;
    const ymin = this.camera.userData.initialPosY - dist;
    const ymax = this.camera.userData.initialPosY + dist;
    const ref = this;
    const time = this.utils.randomIntFromInterval(1, 3);
    TweenMax.to(this.camera.position, time, {
        bezier: [
          {
            x: this.utils.randomIntFromInterval(xmin * 1000, xmax * 1000) / 1000,
            y: this.utils.randomIntFromInterval(ymin * 1000, ymax * 1000) / 1000
          },
          {
            x: this.utils.randomIntFromInterval(xmin * 1000, xmax * 1000) / 1000,
            y: this.utils.randomIntFromInterval(ymin * 1000, ymax * 1000) / 1000
          }
        ],
        ease: Power2.easeInOut,
        onComplete: () => {
          ref.animate();
      }});
  }

}
