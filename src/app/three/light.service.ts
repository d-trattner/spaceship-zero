import { Injectable } from '@angular/core';

import * as THREE from 'three';

import { PlanetService } from '../three/planet.service';

@Injectable()
export class LightService {

  private enableLightHelpers: Boolean = false;

  private scene: THREE.Scene;

  public shadowMapSize = 1028;

  /* LIGHTS */

  public spotLight: THREE.SpotLight;

  public sunLight: THREE.DirectionalLight;
  private sunLightAngle: number = 0;

  public movingLight: THREE.PointLight;
  //private movingLightDistance: number = 16.3;
  private movingLightDistance: number = 100;
  private movingLightRadius: number = 1;
  private movingLightSpeed: number = 0.99;
  private movingLightDir: number = 1;
  private movingLightAngle: number = 0;
  //private movingLightY: number = 20;
  private movingLightY: number = 1;

  private projectionLight: THREE.PointLight;

  constructor(
    public planetService: PlanetService
  ) { }

  public create(_scene: THREE.Scene) {
    this.scene = _scene;

    this.scene.add( new THREE.AmbientLight( 0x808080 ) );

    this.sunLight = new THREE.DirectionalLight(0xEDC618, 1);
    this.sunLight.position.set( -1, 3, -5 );
    this.sunLight.castShadow = true;
    this.sunLight.shadow.bias = 0.0001;
    this.sunLight.shadow.mapSize.width = this.shadowMapSize;
    this.sunLight.shadow.mapSize.height = this.shadowMapSize;
    this.scene.add( this.sunLight );

    if ( this.enableLightHelpers) {
      this.sunLight.add( new THREE.DirectionalLightHelper( this.sunLight ) );
    }

    this.sunLight.lookAt(this.planetService.mesh.position);

    this.spotLight = new THREE.SpotLight( 0x76C6E8 );
    this.spotLight.position.set( 10, 3, 10 );
    this.spotLight.penumbra = 0.8;
    this.spotLight.castShadow = true;
    this.spotLight.shadow.bias = 0.0001;
    this.spotLight.shadow.mapSize.width = this.shadowMapSize;
    this.spotLight.shadow.mapSize.height = this.shadowMapSize;
    this.spotLight.distance = 1000;
    this.scene.add( this.spotLight );

    if ( this.enableLightHelpers) {
      this.spotLight.add( new THREE.SpotLightHelper( this.spotLight ) );
    }

    this.spotLight.lookAt(this.planetService.mesh.position);

    this.movingLight = new THREE.PointLight(0x00BFFF, 1);
    this.movingLight.castShadow = true;
    this.movingLight.distance = this.movingLightDistance + 5;
    this.movingLight.shadow.mapSize.width = this.shadowMapSize;
    this.movingLight.shadow.mapSize.height = this.shadowMapSize;
    //this.movingLight.position.set( -this.movingLightDistance, 1, 2.8 );
    this.scene.add( this.movingLight );

    if ( this.enableLightHelpers) {
      this.movingLight.add( new THREE.PointLightHelper( this.movingLight, 0.5 ) );
    }

    this.projectionLight = new THREE.PointLight(0x00BFFF, 1);
    //this.projectionLight.castShadow = true;
    //this.projectionLight.distance = 10;
    this.projectionLight.shadow.mapSize.width = this.shadowMapSize;
    this.projectionLight.shadow.mapSize.height = this.shadowMapSize;
    this.projectionLight.position.set( 0, 0.5, 0.5 );
    this.scene.add( this.projectionLight );

    if ( this.enableLightHelpers) {
      this.projectionLight.add( new THREE.PointLightHelper( this.projectionLight, 0.5 ) );
    }

  }

  public animate() {

    if (this.spotLight) {
      this.spotLight.lookAt(this.planetService.mesh.position);
    }

    if (this.movingLight)  {
      this.movingLight.position.x = this.movingLightRadius * Math.sin( this.movingLightAngle );
      this.movingLight.position.z = this.movingLightDistance + this.movingLightRadius * Math.cos( this.movingLightAngle );
      this.movingLight.position.y = this.movingLightY;
      this.movingLightAngle += this.movingLightSpeed;
    }

    if (this.sunLight) {
      this.sunLightAngle += 0.001;
      this.sunLight.position.x = 10 * Math.sin( this.sunLightAngle );
      this.sunLight.position.y = 10 * Math.cos( this.sunLightAngle );
      this.sunLight.lookAt(this.planetService.mesh.position);
    }
  }

}
