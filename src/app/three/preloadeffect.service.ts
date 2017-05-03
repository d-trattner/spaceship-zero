import { Injectable } from '@angular/core';

import * as THREE from 'three';

import {TweenMax, Power2, Linear, TimelineLite} from 'gsap';

@Injectable()
export class PreloadeffectService {

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;

  private animationFrameId: number;

  private light1: THREE.DirectionalLight;
  private light2: THREE.DirectionalLight;
  private light3: THREE.PointLight;
  private light4: THREE.PointLight;

  private geometry: THREE.CylinderGeometry;
  private texture: THREE.Texture;

  private mesh: THREE.Mesh;

  constructor() { }

  public create() {

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      10000 );
    this.camera.position.set(0, 0, 7);
    this.camera.lookAt(this.scene.position);

    this.canvas = document.createElement("canvas");
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0px';
    this.canvas.style.top = '0px';
    this.canvas.style.zIndex = '1000000';
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    document.body.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: false });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.gammaInput = true;
    this.renderer.gammaOutput = true;

    this.light1	= new THREE.DirectionalLight( 0xff8000, 1.5 );
    this.light1.position.set( 1, 1, 0 ).normalize();
    this.scene.add( this.light1 );

    this.light2	= new THREE.DirectionalLight( 0xff8000, 1.5 );
    this.light2.position.set( -1, 1, 0 ).normalize();
    this.scene.add( this.light2 );

    this.light3	= new THREE.PointLight( 0x44FFAA, 15, 25 );
    this.light3.position.set( 0, -3, 0 );
    this.scene.add( this.light3 );

    this.light4	= new THREE.PointLight( 0xff4400, 20, 30 );
    this.light4.position.set( 3, 3, 0 );
    this.scene.add( this.light4 );

    this.scene.fog	= new THREE.FogExp2( 0x000000, 0.15 );

    this.geometry	= new THREE.CylinderGeometry( 1, 1, 30, 32, 1, true );
    this.texture = THREE.ImageUtils.loadTexture( "assets/textures/water.jpg" );
    this.texture.wrapT	= THREE.RepeatWrapping;
    let material	= new THREE.MeshLambertMaterial({color : 0xFFFFFF, map : this.texture, side: THREE.BackSide});
    this.mesh	= new THREE.Mesh( this.geometry, material );
    this.mesh.rotation.x	= Math.PI / 2;
    this.mesh.position.y += 0.5;
    this.scene.add( this.mesh );

    const ref: PreloadeffectService = this;

    (function render() {
      ref.animationFrameId = requestAnimationFrame(render);
      ref.animate();
      ref.renderer.render(ref.scene, ref.camera);
    }());

  }

  public animate() {
    this.texture.offset.y	-= 0.008;
    this.texture.offset.y	%= 1;
    this.texture.needsUpdate	= true;
  }

  public destroy() {
    const scale = new TimelineLite({onComplete: () => {
      this.reallyDestroy();
    }});
    scale.to(this.mesh.scale, 1, {y: 3, ease: Power2.easeOut});
    //scale.to(this.mesh.scale, 0.5, {y: 0.1, ease: Power2.easeIn});

    const pos = new TimelineLite();
    pos.to(this.mesh.position, 0.5, {z: 1, ease: Power2.easeOut});
    pos.to(this.mesh.position, 0.5, {z: 5, ease: Power2.easeIn});
  }

  private reallyDestroy() {
    cancelAnimationFrame(this.animationFrameId); // Stop the animation
    //this.renderer.domElement.addEventListener('dblclick', null, false); //remove listener to render
    this.scene.remove(this.mesh);
    this.scene.remove(this.light1);
    this.scene.remove(this.light2);
    this.scene.remove(this.light3);
    this.scene.remove(this.light4);

    this.scene = null;
    this.camera = null;
    document.body.removeChild(this.canvas);
  }

}
