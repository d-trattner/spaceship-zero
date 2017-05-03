import { Injectable } from '@angular/core';

import * as THREE from 'three';

import {TweenMax, Power2} from 'gsap';

import { UtilsService } from '../three/utils.service';
import { AssetService } from '../three/asset.service';
import { PlanetService } from '../three/planet.service';

@Injectable()
export class AsteroidService {

  private scene: THREE.Scene;
  private asteroids: Array<any> = [];

  private count: number = 1000;

  // default random movement
  private orbitAroundPlanet = true;

  constructor(
    public utils: UtilsService,
    public assets: AssetService,
    public planet: PlanetService
  ) { }

  private randomVelocity() {
    return {
      x: this.utils.randomIntFromInterval(-100, 100) / 100,
      y: this.utils.randomIntFromInterval(-100, 100) / 100,
      z: this.utils.randomIntFromInterval(-100, 100) / 100
    };
  }

  private randomPosition() {
    return {
      x: this.utils.randomIntFromInterval(-1000, 1000),
      y: this.utils.randomIntFromInterval(-1000, 1000),
      z: this.utils.randomIntFromInterval(-1000, 1000)
    };
  }

  private randomScale() {
    return this.utils.randomIntFromInterval(1, 20) / 100;
  }

  public create(_scene: THREE.Scene) {
    this.scene = _scene;

    const material = new THREE.MeshStandardMaterial({
          color: 0x080808,
          shading: THREE.FlatShading,
          side: THREE.FrontSide,
          blending: THREE.AdditiveBlending,
          metalness: 0
    });

    let model: THREE.Geometry, mesh: THREE.Mesh, pos: any, vel: any, scale: number;
    for (let i = 0; i < this.count; i++) {
      model = this.assets.getModel('asteroid' + this.utils.randomIntFromInterval(1, 3));
      mesh = new THREE.Mesh(model, material);
      pos = this.randomPosition();
      vel = this.randomVelocity();
      scale = this.randomScale();
      mesh.position.set(pos.x, pos.y, pos.z);
      if (this.orbitAroundPlanet) {
        mesh.position.y = this.planet.planetPosition.planetPositionY + this.planet.planetRadius / 2;
      }
      mesh.scale.set(scale, scale, scale);
      this.asteroids.push({
        mesh: mesh,
        velocity: vel,
        angle: this.utils.randomIntFromInterval(0, 360)
      });
      this.scene.add(mesh);
    }

  }

  public animate() {
    let mesh: THREE.Mesh, vel: any, pos: any;
    for (let i = 0; i < this.count; i++) {
      mesh = this.asteroids[i].mesh;
      vel = this.asteroids[i].velocity;
      if (this.orbitAroundPlanet) {
        mesh.position.x = this.planet.planetPosition.planetPositionX + (this.planet.planetRadius + vel.x) * Math.sin(this.asteroids[i].angle*Math.PI/180);
        mesh.position.z = this.planet.planetPosition.planetPositionZ + (this.planet.planetRadius + vel.z) * Math.cos(this.asteroids[i].angle*Math.PI/180);
        //mesh.position.z = this.planet.planetPosition.planetPositionZ + this.planet.planetRadius * Math.tan(this.asteroids[i].angle);
        
        this.asteroids[i].angle -= 0.01;
      } else {
        if (Math.abs(mesh.position.x) > 1000 || Math.abs(mesh.position.y) > 1000 || Math.abs(mesh.position.z) > 1000) {
          pos = this.randomPosition();
          mesh.position.set(pos.x, pos.y, pos.z);
        } else {
          mesh.position.x += vel.x;
          mesh.position.y += vel.y;
          mesh.position.z += vel.z;
          mesh.rotation.x += vel.x;
          mesh.rotation.y += vel.y;
          mesh.rotation.z += vel.z;
        }
      }
    }
  }

}
