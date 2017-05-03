import { Injectable } from '@angular/core';

import * as THREE from 'three';

import {TweenMax, Power2, Linear, TimelineLite} from 'gsap';

import { UtilsService } from '../three/utils.service';
import { AssetService } from '../three/asset.service';
import { LightService } from '../three/light.service';
import { CameraService } from '../three/camera.service';

@Injectable()
export class ShipService {

  private scene: THREE.Scene;

  private ship: THREE.Mesh;

  private movingShip: THREE.Mesh;
  private wormhole: THREE.Mesh;
  private wormHoleLight: THREE.PointLight;

  private motherShip: THREE.Mesh;
  private motherShipLight: THREE.PointLight;
  private motherShipRing1: THREE.Mesh;
  private motherShipRing2: THREE.Mesh;

  private audioLoader = new THREE.AudioLoader();

  constructor(
    public utils: UtilsService,
    public assets: AssetService,
    public lightService: LightService,
    public cameraService: CameraService,
  ) { }

  public create(_scene: THREE.Scene) {
    this.scene = _scene;

    // SHIP
    const texture = this.assets.getTexture('ship');
    //texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    //texture.repeat.set( 2, 2 );

    const ship_bump = this.assets.getTexture('ship_bump');
    //ship_bump.wrapS = texture.wrapT = THREE.RepeatWrapping;
    //ship_bump.repeat.set( 10, 10 );

    const envMap = this.assets.getCubemap('ship');
    envMap.format = THREE.RGBFormat;
    envMap.mapping = THREE.CubeReflectionMapping;

    const shipMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          //bumpMap: ship_bump,
          //bumpScale: 0.001,
          //bumpScale: 0.01,
          envMap: envMap,
          metalness: 1,
          shading: THREE.SmoothShading,
          side: THREE.DoubleSide
    });
    const ship = new THREE.Mesh(this.assets.getModel('ship'), shipMaterial);
    ship.receiveShadow = true;
    ship.castShadow = true;
    this.scene.add(ship);

    const shipSound = new THREE.PositionalAudio( this.cameraService.listener1 );
    this.audioLoader.load( 'assets/audio/innerloop.ogg', function( buffer ) {
      shipSound.setBuffer( buffer );
      shipSound.setRefDistance( 1 );
      shipSound.setLoop(true);
      shipSound.play();
    }, () => {}, () => {});

    ship.add(shipSound);

    // GLASS
    const material = new THREE.MeshStandardMaterial({
          map: this.assets.getTexture('glas'),
          bumpMap: this.assets.getTexture('glas_bump'),
          bumpScale: 0.1,
          envMap: envMap,
          metalness: 1,
          shading: THREE.SmoothShading,
          side: THREE.DoubleSide,
          transparent: true//,
          //alphaTest: 0.5,
          //opacity: 0.5
    });

    const glas = new THREE.Mesh(this.assets.getModel('glas'), material);
    glas.receiveShadow = true;
    glas.castShadow = true;
    this.scene.add(glas);

    // FLYBYSHIP
    this.movingShip = new THREE.Mesh(this.assets.getModel('ship_complete'), shipMaterial);
    this.movingShip.receiveShadow = true;
    this.movingShip.castShadow = true;
    this.movingShip.scale.set(0.1, 0.1, 0.1);
    this.movingShip.position.set(-50, -5, -19);
    this.scene.add(this.movingShip);

    const mshipSound = new THREE.PositionalAudio( this.cameraService.listener2 );
    this.audioLoader.load( 'assets/audio/movingship.ogg', function( buffer ) {
      mshipSound.setBuffer( buffer );
      mshipSound.setRefDistance( 1 );
      mshipSound.setLoop(true);
      mshipSound.play();
    }, () => {}, () => {});

    this.movingShip.add(mshipSound);

    const wormholeMat = new THREE.MeshStandardMaterial({
          map: this.assets.getTexture('wormhole'),
          metalness: 1,
          shading: THREE.SmoothShading,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 1
    });
    this.wormhole = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 1, 1), wormholeMat);
    this.scene.add(this.wormhole);

    this.wormHoleLight = new THREE.PointLight(0xffffff, 1);
    this.wormHoleLight.intensity = 0;
    this.wormhole.add(this.wormHoleLight);

    this.animateMovingShip();

    // MOTHERSHIP
    this.motherShip = new THREE.Mesh(this.assets.getModel('mothership'), shipMaterial);
    this.motherShip.receiveShadow = true;
    this.motherShip.castShadow = true;
    this.motherShip.scale.set(2, 2, 2);
    this.motherShip.position.set(6, -15, -42);
    this.motherShip.rotateY(-30 * Math.PI / 180);
    this.scene.add(this.motherShip);

    const moshipSound = new THREE.PositionalAudio( this.cameraService.listener3 );
    this.audioLoader.load( 'assets/audio/mothership.ogg', function( buffer ) {
      moshipSound.setBuffer( buffer );
      moshipSound.setRefDistance( 2 );
      moshipSound.setLoop(true);
      moshipSound.play();
    }, () => {}, () => {});

    this.motherShip.add(moshipSound);

    this.motherShipLight = new THREE.PointLight(0x00BFFF, 1);
    this.motherShipLight.castShadow = true;
    this.motherShipLight.shadow.mapSize.width = this.lightService.shadowMapSize;
    this.motherShipLight.shadow.mapSize.height = this.lightService.shadowMapSize;
    this.motherShipLight.position.set( 0, 0, 0 );
    this.motherShip.add(this.motherShipLight);

    this.motherShipRing1 = new THREE.Mesh(this.assets.getModel('mothership_ring1'), shipMaterial);
    this.motherShipRing1.receiveShadow = true;
    this.motherShipRing1.castShadow = true;
    this.motherShip.add(this.motherShipRing1);
    this.motherShipRing2 = new THREE.Mesh(this.assets.getModel('mothership_ring2'), shipMaterial);
    this.motherShipRing2.receiveShadow = true;
    this.motherShipRing2.castShadow = true;
    this.motherShip.add(this.motherShipRing2);

    const motherShipSphere = new THREE.Mesh(this.assets.getModel('mothership_sphere'), new THREE.MeshBasicMaterial({color: 0xffffff}));
    motherShipSphere.receiveShadow = true;
    motherShipSphere.castShadow = true;
    this.motherShip.add(motherShipSphere);

    // MOTHERSHIP DRONES
    // starting z-positions 4 and 6
    let drone: THREE.Mesh;
    for (let i = 0; i < 10; i++) {
      drone = new THREE.Mesh(new THREE.SphereGeometry(0.075, 4, 4), shipMaterial);
      drone.position.set(0, 0, 4);
      this.motherShip.add(drone);
      this.animateMotherShipDrone(drone);
    }

  }

  public animate() {
    this.motherShipRing1.rotation.z += 0.12;
    this.motherShipRing2.rotation.x -= 0.12;
  }



  // GSAP ANIMATION

  private openWormhole() {
    this.wormhole.scale.set(0, 0, 0);
    this.wormhole.rotation.y = 90 * Math.PI / 180;
    this.wormhole.rotation.x = 0;
    this.wormhole.position.set(this.movingShip.position.x, this.movingShip.position.y, this.movingShip.position.z);
    TweenMax.to(this.wormhole.scale, 0.5, {
      x: 1,
      y: 1,
      z: 1,
      ease: Power2.easeOut,
      onComplete: () => {
        TweenMax.to(this.wormhole.scale, 0.5, {
          x: 0,
          y: 0,
          z: 0,
          ease: Power2.easeIn
        });
      }
    });
    TweenMax.to(this.wormHoleLight, 0.5, {
      intensity: 1,
      ease: Power2.easeOut,
      onComplete: () => {
        TweenMax.to(this.wormHoleLight, 0.5, {
          intensity: 0,
          ease: Power2.easeIn
        });
      }
    });
    TweenMax.to(this.wormhole.rotation, 1, {
      x: 20,
      ease: Power2.easeInOut,
    });
  }

  private hideMovingShip() {
    this.movingShip.position.x = -10000;
    this.movingShip.position.y = -10000;
    this.movingShip.position.z = -10000;
  }

  private animateMovingShip() {

    const xmin = -50;
    const xmax = 50;
    const ymin = -10;
    const ymax = 0;
    const zmin = -10;
    const zmax = -2;

    let s: THREE.Mesh = this.movingShip;
    this.movingShip.position.y = this.utils.randomIntFromInterval(ymin, ymax);
    this.movingShip.position.z = this.utils.randomIntFromInterval(zmin, zmax);

    let type = this.utils.randomIntFromInterval(0, 3);
    let dir = this.utils.randomIntFromInterval(0, 1);

    let time1 = dir === 0 ? this.utils.randomIntFromInterval(2, 10) : this.utils.randomIntFromInterval(1, 2);
    let time2 = dir === 0 ? this.utils.randomIntFromInterval(1, 2) : this.utils.randomIntFromInterval(2, 10);

    let params: Array<Array<number>> = [];
    switch (dir) {
      case 0:
        this.movingShip.position.x = xmin;
        switch (type) {
          case 0:
            params.push([this.utils.randomIntFromInterval(-2, 2), this.utils.randomIntFromInterval(zmin, zmax)]);
            params.push([xmax, this.utils.randomIntFromInterval(zmin, zmax)]);
            break;
          case 1:
            params.push([this.utils.randomIntFromInterval(-2, 2), this.utils.randomIntFromInterval(ymin, ymax)]);
            params.push([xmax, this.utils.randomIntFromInterval(ymin, ymax)]);
            break;
          case 2:
            params.push([this.utils.randomIntFromInterval(xmin / 2 - 2, xmin / 2 + 2), this.utils.randomIntFromInterval(ymin, ymax)]);
            params.push([this.utils.randomIntFromInterval(-2, 2), this.utils.randomIntFromInterval(ymin, ymax)]);
            params.push([this.utils.randomIntFromInterval(xmax / 2 - 2, xmax / 2 + 2), this.utils.randomIntFromInterval(ymin, ymax)]);
            params.push([xmax, this.utils.randomIntFromInterval(ymin, ymax)]);
            break;
          case 3:
            params.push([this.utils.randomIntFromInterval(xmin / 2 - 2, xmin / 2 + 2), this.utils.randomIntFromInterval(zmin, zmax)]);
            params.push([this.utils.randomIntFromInterval(-2, 2), this.utils.randomIntFromInterval(zmin, zmax)]);
            params.push([this.utils.randomIntFromInterval(xmax / 2 - 2, xmax / 2 + 2), this.utils.randomIntFromInterval(zmin, zmax)]);
            params.push([xmax, this.utils.randomIntFromInterval(zmin, zmax)]);
            break;
        }
        break;
      case 1:
        this.movingShip.position.x = xmax;
        switch (type) {
          case 0:
            params.push([this.utils.randomIntFromInterval(-2, 2), this.utils.randomIntFromInterval(zmin, zmax)]);
            params.push([xmin, this.utils.randomIntFromInterval(zmin, zmax)]);
            break;
          case 1:
            params.push([this.utils.randomIntFromInterval(-2, 2), this.utils.randomIntFromInterval(ymin, ymax)]);
            params.push([xmin, this.utils.randomIntFromInterval(ymin, ymax)]);
            break;
          case 2:
            params.push([this.utils.randomIntFromInterval(xmax / 2 - 2, xmax / 2 + 2), this.utils.randomIntFromInterval(ymin, ymax)]);
            params.push([this.utils.randomIntFromInterval(-2, 2), this.utils.randomIntFromInterval(ymin, ymax)]);
            params.push([this.utils.randomIntFromInterval(xmin / 2 - 2, xmin / 2 + 2), this.utils.randomIntFromInterval(ymin, ymax)]);
            params.push([xmin, this.utils.randomIntFromInterval(ymin, ymax)]);
            break;
          case 3:
            params.push([this.utils.randomIntFromInterval(xmax / 2 - 2, xmax / 2 + 2), this.utils.randomIntFromInterval(zmin, zmax)]);
            params.push([this.utils.randomIntFromInterval(-2, 2), this.utils.randomIntFromInterval(zmin, zmax)]);
            params.push([this.utils.randomIntFromInterval(xmin / 2 - 2, xmin / 2 + 2), this.utils.randomIntFromInterval(zmin, zmax)]);
            params.push([xmin, this.utils.randomIntFromInterval(zmin, zmax)]);
            break;
        }
    }

    this.openWormhole();

    // shootaway
    let secondBezier;
    let shootaway = Math.round(Math.random());
    if (type === 2 || type === 3) {
      if (shootaway === 1) {
        dir = this.utils.randomIntFromInterval(0, 1);
        time1 = dir === 0 ? this.utils.randomIntFromInterval(2, 10) : this.utils.randomIntFromInterval(1, 2);
        time2 = dir === 0 ? this.utils.randomIntFromInterval(1, 2) : this.utils.randomIntFromInterval(2, 10);
        if (dir === 0) {
          secondBezier = [
            {x: 10, z: -this.utils.randomIntFromInterval(30, 70)},
            {x: this.utils.randomIntFromInterval(1, 5), z: -1000}
          ];
        } else {
          secondBezier = [
            {x: -70, z: -50},
            {x: -50, z: -1000}
          ];
        }
      }
    }

    const easeOut = Power2.easeOut;
    const easeIn = Power2.easeIn;
    const easeInOut = Power2.easeInOut;
    const ref = this;
    if (type === 0) {
      TweenMax.to(this.movingShip.position, time1, {
        bezier: [
          {x: params[0][0], z: params[0][1]},
          {x: params[1][0], z: params[1][1]}
        ],
        ease: easeInOut,
        onComplete: () => {
          ref.openWormhole();
          ref.hideMovingShip();
          setTimeout(() => {
            ref.animateMovingShip();
          }, this.utils.randomIntFromInterval(2000, 10000));
      }});
    } else if (type === 1) {
      TweenMax.to(this.movingShip.position, time1, {
        bezier: [
          {x: params[0][0], y: params[0][1]},
          {x: params[1][0], y: params[1][1]}
        ],
        ease: easeInOut,
        onComplete: () => {
          ref.openWormhole();
          ref.hideMovingShip();
          setTimeout(() => {
            ref.animateMovingShip();
          }, this.utils.randomIntFromInterval(2000, 10000));
        }
      });
    } else if (type === 2) {
      if (shootaway === 0) {
        secondBezier = [{x: params[2][0], y: params[2][1]}, {x: params[3][0], y: params[3][1]}]
      }
      TweenMax.to(this.movingShip.position, time1, {
        bezier: [
          {x: params[0][0], y: params[0][1]},
          {x: params[1][0], y: params[1][1]}
        ],
        ease: easeOut,
        onComplete: () => {
            TweenMax.to(this.movingShip.position, time2, {
              bezier: secondBezier,
              ease: easeIn,
              onComplete: () => {
                ref.openWormhole();
                ref.hideMovingShip();
                setTimeout(() => {
                  ref.animateMovingShip();
                }, this.utils.randomIntFromInterval(2000, 10000));
              }
            });
        }
      });
    } else if (type === 3) {
      if (shootaway === 0) {
        secondBezier = [{x: params[2][0], z: params[2][1]}, {x: params[3][0], z: params[3][1]}]
      }
      TweenMax.to(this.movingShip.position, time1, {
        bezier: [
          {x: params[0][0], z: params[0][1]},
          {x: params[1][0], z: params[1][1]}
        ],
        ease: easeOut,
        onComplete: () => {
            TweenMax.to(this.movingShip.position, time2, {
              bezier: secondBezier,
              ease: easeIn,
              onComplete: () => {
                ref.openWormhole();
                ref.hideMovingShip();
                setTimeout(() => {
                  ref.animateMovingShip();
                }, this.utils.randomIntFromInterval(2000, 10000));
              }
            });
        }
      });
    }

  }

  private animateMotherShipDrone(drone) {
    const haven = Math.round(Math.random());
    const havenZ = haven === 0 ? 4 : 6;
    const leaveOrDock = Math.round(Math.random());
    let bezier;
    if (haven === 0) {
      drone.position.z = 4.5;
    } else {
      drone.position.z = 6;
    }
    if (leaveOrDock === 0) { // 0 = leave, 1 = dock
      drone.position.x = 0;
      bezier = [
        {x: this.utils.randomIntFromInterval(5, 10), z: havenZ},
        {x: this.utils.randomIntFromInterval(50, 500), z: this.utils.randomIntFromInterval(-500, 500)},
        {x: this.utils.randomIntFromInterval(500, 1000), z: this.utils.randomIntFromInterval(-1000, 1000)}
      ];
    } else {
      bezier = [
        {x: this.utils.randomIntFromInterval(500, 1000), z: this.utils.randomIntFromInterval(-1000, 1000)},
        {x: this.utils.randomIntFromInterval(100, 500), z: this.utils.randomIntFromInterval(-500, 500)},
        {x: this.utils.randomIntFromInterval(5, 10), z: havenZ},
        {x: 0, z: havenZ}
      ];
      drone.position.x = bezier[0].x;
      drone.position.z = bezier[0].z;
    }

    const ref = this;
    const time = this.utils.randomIntFromInterval(10, 20);
    TweenMax.to(drone.position, time, {
      bezier: {
        type: 'soft',
        values: bezier
      },
      delay: this.utils.randomIntFromInterval(5, 20),
      ease: leaveOrDock === 0 ? Power2.easeIn : Power2.easeOut,
      onComplete: () => {
        ref.animateMotherShipDrone(drone);
    }});
  }

}
