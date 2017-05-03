import { Injectable } from '@angular/core';

import * as THREE from 'three';

import { AssetService } from '../three/asset.service';

@Injectable()
export class SkyboxService {

  private scene: THREE.Scene;
  private sky: THREE.Mesh;

  private latitude: number = 0;
  private longitude: number = 0;
  private phi: number = 0;
  private theta: number = 0;

  private size: number = 2000;

  constructor(
    public assets: AssetService,
  ) { }

  public create(_scene: THREE.Scene) {
    this.scene = _scene;
    const skyBox = new THREE.BoxGeometry(this.size, this.size, this.size);
    const skyBoxMaterial = new THREE.MeshBasicMaterial({
      map: this.getRandomStarField(600, 2048, 2048),
      side: THREE.BackSide
    });
    this.sky = new THREE.Mesh(skyBox, skyBoxMaterial);
    this.scene.add(this.sky);

    const nebulaMat = new THREE.MeshStandardMaterial({
          map: this.assets.getTexture('nebula'),
          metalness: 1,
          shading: THREE.SmoothShading,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7
    });
    const nebula = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 1, 1), nebulaMat);
    nebula.position.set(30, -50, -100);
    this.scene.add(nebula);

  }

  public animate() {
    this.latitude = Math.max(-85, Math.min(85, this.latitude));
    this.phi = THREE.Math.degToRad(90 - this.latitude);
    this.theta = THREE.Math.degToRad(this.longitude);

    this.sky.rotation.x += 0.0001;
    this.sky.rotation.y += 0.0001;
  }

  private getRandomStarField(numberOfStars, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < numberOfStars; ++i) {
      const radius = Math.random() * 2;
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'white';
      ctx.fill();
    }

    const tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    return tex;
  };

}
