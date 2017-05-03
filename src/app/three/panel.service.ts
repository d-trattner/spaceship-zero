import { Injectable } from '@angular/core';

import * as THREE from 'three';

import { UtilsService } from '../three/utils.service';
import { AssetService } from '../three/asset.service';
import { CameraService } from '../three/camera.service';

@Injectable()
export class PanelService {

  private scene: THREE.Scene;
  private canvas: HTMLCanvasElement;

  private panels: Array<any> = [];

  public projectionImage: any;
  public projectionCanvas: HTMLCanvasElement;
  public projectionTexture: THREE.Texture;
  public projectionMaterial: THREE.MeshStandardMaterial;
  public projectionAngle: number = 0;

  private randomPanelStrings: Array<string> = ['&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp'];

  constructor(
    public utils: UtilsService,
    public assets: AssetService,
    public cameraService: CameraService
  ) { }

  public create(_scene: THREE.Scene, _canvas: HTMLCanvasElement) {
    this.scene = _scene;
    this.canvas = _canvas;

    let div, obj;

    div = document.getElementById('panel1');
    div.style.height = (60 / 731) * this.canvas.clientHeight + 'px';
    obj = new THREE.Object3D();
    obj.position.set(-1, 0, 1.3);
    this.scene.add(obj);
    this.panels.push({name: 'leftbottom', div: div, obj: obj, alienText: true});

    div = document.getElementById('panel2');
    div.style.height = (60 / 731) * this.canvas.clientHeight + 'px';
    obj = new THREE.Object3D();
    obj.position.set(.2, 0, 1.3);
    this.scene.add(obj);
    this.panels.push({name: 'rightbottom', div: div, obj: obj, alienText: true});

    // PROJECTION
    this.projectionImage = new Image();

    const imgWidth = 1024;
    this.projectionCanvas = document.createElement( 'canvas' );
    this.projectionCanvas.id = 'projectionTexture';
    //document.body.appendChild(this.projectionCanvas);
    this.projectionCanvas.width = this.projectionCanvas.height = imgWidth;

    this.projectionTexture = new THREE.Texture( this.projectionCanvas );

    const envMap = this.assets.getCubemap('ship');
    this.projectionMaterial = new THREE.MeshStandardMaterial({
      map: this.projectionTexture,
      envMap: envMap,
      metalness: 1,
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });

    const ref = this;
    this.projectionImage.onload = function() {
         const ctx = ref.projectionCanvas.getContext( '2d' );
         ctx.drawImage( ref.projectionImage, 0, 0, ref.projectionCanvas.width, ref.projectionCanvas.width );
         ref.projectionTexture.needsUpdate = true;
    };

    this.projectionImage.src = 'assets/textures/projection.png';

    const projection: THREE.Mesh = new THREE.Mesh(this.assets.getModel('projection'), this.projectionMaterial);
    projection.receiveShadow = true;
    this.scene.add(projection);

    div = document.getElementById('mainPanel');
    div.style.height = (405 / 731) * this.canvas.clientHeight + 'px';
    obj = new THREE.Object3D();
    obj.position.set(-0.545, 1.47043, 0.71409);
    this.scene.add(obj);
    let obj2 = new THREE.Object3D();
    obj2.position.set(0.545, 1.47043, 0.71409);
    this.panels.push({name: 'main', div: div, obj: obj, obj2: obj2, alienText: false});

  }


  public animate() {
    let proj, shouldAddNewLine: Boolean, line: Element, div: HTMLDivElement, numChars: number, str: string;

    //const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const charsArray = chars.split('');

    for (let i = 0; i < this.panels.length; i++) {

      div = this.panels[i].div;
      if (this.cameraService.activeCamera !== this.cameraService.camera1) {
        div.style.left = '-10000px';
        div.style.top = '-10000px';
      } else {
        proj = this.toScreenPosition(this.panels[i].obj, this.cameraService.camera);
        div.style.left = proj.x + 'px';
        div.style.top = proj.y + 'px';

        // main correction
        if (this.panels[i].name === 'main') {
          let proj2 = this.toScreenPosition(this.panels[i].obj2, this.cameraService.camera);
          div.style.width = proj2.x - proj.x + 'px';
          //div.style.height = ((405 / 731) * this.canvas.clientHeight) - Math.abs(this.cameraService.camera.position.y) + 'px';
        }

        if (this.panels[i].alienText) {
          shouldAddNewLine = this.utils.randomIntFromInterval(0, 10) === 0 ? true : false;
          if (shouldAddNewLine) {
            if (this.randomPanelStrings.length < 100) {
              str = '';
              numChars = Math.random() * 25;
              for (let j = 0; j < numChars; j++) {
                str += charsArray[Math.floor(Math.random() * charsArray.length)];
              }
              this.randomPanelStrings.push(str);
            } else {
              str = this.randomPanelStrings[Math.floor(Math.random() * this.randomPanelStrings.length)];
            }
            // generate 10 divs and reuse top divs (not generating or destroying more dom elements)
            if (div.firstElementChild.firstElementChild.childNodes.length === 10) {
              div.firstElementChild.firstElementChild.firstElementChild.innerHTML = str;
              div.firstElementChild.firstElementChild.appendChild(div.firstElementChild.firstElementChild.firstElementChild);
            } else {
              line = document.createElement('div');
              line.innerHTML = str;
              div.firstElementChild.firstElementChild.appendChild(line);
            }
          }
        }
      }
    }

    // projection rotating canvas texture
    const ctx = this.projectionCanvas.getContext( '2d' );
    ctx.clearRect(0, 0, this.projectionCanvas.width, this.projectionCanvas.width);
    ctx.translate(this.projectionCanvas.width / 2, this.projectionCanvas.width / 2);
    ctx.rotate( 1 * Math.PI / 180 );
    ctx.translate(-this.projectionCanvas.width / 2, -this.projectionCanvas.width / 2);
    ctx.drawImage( this.projectionImage, 0, 0, this.projectionCanvas.width, this.projectionCanvas.width );
    this.projectionTexture.needsUpdate = true;
    this.projectionMaterial.opacity = 0.5 + Math.random() / 5;

  }

  private toScreenPosition(obj, camera) {
    const vector = new THREE.Vector3();
    // TODO: need to update this when resize window
    const widthHalf = 0.5 * this.canvas.width;
    const heightHalf = 0.5 * this.canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return {
        x: vector.x,
        y: vector.y
    };
  }

}
