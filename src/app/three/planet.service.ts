import { Injectable } from '@angular/core';

import * as THREE from 'three';

import { AssetService } from '../three/asset.service';

@Injectable()
export class PlanetService {

  private scene: THREE.Scene;

  private uniforms: any;
  public mesh: THREE.Mesh;
  public ringMesh1: THREE.Mesh;
  public ringMesh2: THREE.Mesh;
  public ringMesh3: THREE.Mesh;
  public planetRadius: number = 40;
  public planetPosition: any = {
    planetPositionX: -33,
    planetPositionY: -35,
    planetPositionZ: -60
  };


  constructor(
    public assets: AssetService
  ) { }

  public create(_scene: THREE.Scene) {
    this.scene = _scene;
    this.uniforms = {
      fogDensity: { value: 0.03 },
      fogColor:   { value: new THREE.Vector3( 0, 0, 0 ) },
      time:       { value: 0.1 },
      resolution: { value: new THREE.Vector2() },
      uvScale:    { value: new THREE.Vector2( 1.0, 1.0 ) },
      texture1:   { value: this.assets.getTexture('planetcloud') },
      texture2:   { value: this.assets.getTexture('planetsurface') }
    };

    this.uniforms.texture1.value.wrapS = this.uniforms.texture1.value.wrapT = THREE.RepeatWrapping;
    this.uniforms.texture2.value.wrapS = this.uniforms.texture2.value.wrapT = THREE.RepeatWrapping;

    const material = new THREE.ShaderMaterial( {
      uniforms: this.uniforms,
      vertexShader: document.getElementById( 'vertexShader' ).textContent,
      fragmentShader: document.getElementById( 'fragmentShader' ).textContent
    } );

    this.mesh = new THREE.Mesh( new THREE.SphereGeometry( this.planetRadius, 64, 64), material );
    this.mesh.receiveShadow = true;
    this.mesh.position.set(
      this.planetPosition.planetPositionX,
      this.planetPosition.planetPositionY,
      this.planetPosition.planetPositionZ
    );
    this.scene.add( this.mesh );

    /*
    const planetLight = new THREE.PointLight( 0xffffff );
    planetLight.castShadow = true;
    this.mesh.add( planetLight );
    planetLight.position.set(0, -50, 0);
    */

    // glow
    const intensity = 0.1;
    const fade = 7;
    const planetGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        'c': {
          type: 'f',
          value: intensity
        },
        'p': {
          type: 'f',
          value: fade
        },
        glowColor: {
          type: 'c',
          value: new THREE.Color(0x93cfef)
        },
        viewVector: {
          type: 'v3',
          value: new THREE.Vector3(0, -50, -50)
        }
      },
      vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize( normalMatrix * normal );
          vec3 vNormel = normalize( normalMatrix * viewVector );
          intensity = pow( c - dot(vNormal, vNormel), p );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`
      ,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() 
        {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4( glow, 1.0 );
        }`
      ,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    const glow = new THREE.Mesh( new THREE.SphereGeometry( 40.1, 64, 64), planetGlowMaterial );
    this.mesh.add(glow);


    // ring

    const envMap = this.assets.getCubemap('ship');

    const ringMaterial = new THREE.MeshStandardMaterial({
      map: this.assets.getTexture('planet_ring'),
      //bumpMap: this.assets.getTexture('planet_ring'),
      //bumpScale: 0.1,
      envMap: envMap,
      metalness: 1,
      shading: THREE.SmoothShading,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });

    //const ringMaterial = new THREE.MeshBasicMaterial({color:0xff0000});

    const ringScale = 8;

    this.ringMesh1 = new THREE.Mesh(this.assets.getModel('planet_ring'), ringMaterial);
    this.ringMesh1.receiveShadow = true;
    this.ringMesh1.castShadow = true;
    this.ringMesh1.scale.set(ringScale, ringScale, ringScale);
    this.ringMesh1.position.set(
      this.planetPosition.planetPositionX,
      this.planetPosition.planetPositionY + this.planetRadius / 2,
      this.planetPosition.planetPositionZ
    );
    this.scene.add(this.ringMesh1);

    this.ringMesh2 = new THREE.Mesh(this.assets.getModel('planet_ring'), ringMaterial);
    this.ringMesh2.receiveShadow = true;
    this.ringMesh2.castShadow = true;
    this.ringMesh2.scale.set(ringScale, ringScale, ringScale);
    this.ringMesh2.position.set(
      this.planetPosition.planetPositionX,
      this.planetPosition.planetPositionY + this.planetRadius / 2 - 0.5,
      this.planetPosition.planetPositionZ
    );
    this.scene.add(this.ringMesh2);

    this.ringMesh3 = new THREE.Mesh(this.assets.getModel('planet_ring'), ringMaterial);
    this.ringMesh3.receiveShadow = true;
    this.ringMesh3.castShadow = true;
    this.ringMesh3.scale.set(ringScale, ringScale, ringScale);
    this.ringMesh3.position.set(
      this.planetPosition.planetPositionX,
      this.planetPosition.planetPositionY + this.planetRadius / 2 + 0.5,
      this.planetPosition.planetPositionZ
    );
    this.scene.add(this.ringMesh3);

  }

  public animate(clock: THREE.Clock) {
    const now: Date = new Date();
    const delta = 5 * clock.getDelta();
    this.uniforms.time.value += 0.01 * delta;
    this.mesh.rotation.y += 0.005 * delta;
    this.ringMesh1.rotation.y -= 0.0001;
    this.ringMesh1.rotation.y -= 0.0002;
    this.ringMesh1.rotation.y -= 0.0003;
    /* TODO SUN ANIMATION COMES TO LIGHT SERVICE ANIMATE FUNCTION
    this.sunLightAngle += 0.001;
    this.sunLight.position.x = 10 * Math.sin( this.sunLightAngle );
    this.sunLight.position.y = 10 * Math.cos( this.sunLightAngle );

    // this.sunLight.lookAt(this.cameraTarget);
    this.sunLight.lookAt(this.mesh.position);
    */
  }

}
