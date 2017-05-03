import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';

import * as THREE from 'three';

//const TWEEN = require('tween.js');
import {TweenMax, Power2, Linear, TimelineLite} from 'gsap';



const DAT = require('dat-gui');

const EffectComposer = require('three-effectcomposer')(THREE);
const FXAAShader = require('../shaders/FXAAShader.js')(THREE);

const BloomPass = require('../shaders/BloomPass.js')(THREE);
const FilmShader = require('../shaders/FilmShader.js')(THREE);
const FilmPass = require('../shaders/FilmPass.js')(THREE);

const UnrealBloomPass = require('../postprocessing/UnrealBloomPass.js')(THREE);

@Component({
  selector: 'app-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.css']
})

export class SceneComponent implements AfterViewInit {

  /* DEV */
  private enableLightHelpers: Boolean = false;
  private enableMovingStars: Boolean = false;
  private enableGui: Boolean = false;

  /* STAGE PROPERTIES */

  private devGui: any;

  private camera: THREE.PerspectiveCamera;
  private cameraTarget: THREE.Vector3;
  private scene: THREE.Scene;
  private renderPass: any;
  private composer: any;
  private effectFXAA: any;
  private bloomPass: any;

  private jsonLoader = new THREE.JSONLoader();
  private textureLoader = new THREE.TextureLoader();

  private shadowMapSize: number = 1028;

  /*
  private bloomParams = {
      projection: 'normal',
      background: false,
      exposure: 0.82,
      threshold: 0.75,
      strength: 0.33,
      radius: 1
    };
    */
    private bloomParams = {
      projection: 'normal',
      background: false,
      exposure: 0.72,
      threshold: 0.7,
      strength: 5.74,
      radius: 0
    };

  /* ASSETS */
  tDir = 'assets/textures/';
  loadTextures = [
    /*
    {name: 'alu', file: this.tDir + 'alu.jpg'},
    {name: 'bump', file: this.tDir + 'ship_bump.jpg'},
    */
    {name: 'ship', file: this.tDir + 'ship/ship3.jpg'},
    {name: 'ship_bump', file: this.tDir + 'ship/ship3_bump.jpg'},
    {name: 'star', file: this.tDir + 'star_moving.png'},
    {name: 'planetcloud', file: this.tDir + 'planet/cloud.png'},
    {name: 'planetsurface', file: this.tDir + 'planet/surface.jpg'},
    {name: 'glas', file: this.tDir + 'glas_uv.png'},
    {name: 'glas_bump', file: this.tDir + 'glas_uv_bump.jpg'},
    {name: 'projection', file: this.tDir + 'projection.png'}
  ];
  textureLoading;
  textures = [];

  mDir = 'assets/models/';
  loadModels = [
    {name: 'ship', file: this.mDir + 'ship3.json'},
    {name: 'glas', file: this.mDir + 'glas.json'},
    {name: 'ship_complete', file: this.mDir + 'ship_complete.json'},
    {name: 'mothership', file: this.mDir + 'mothership.json'},
    {name: 'mothership_ring1', file: this.mDir + 'mothership_ring1.json'},
    {name: 'mothership_ring2', file: this.mDir + 'mothership_ring2.json'},
    {name: 'projection', file: this.mDir + 'projection.json'}
  ];
  modelLoading;
  models: Array<THREE.Geometry> = [];

  private clock = new THREE.Clock();

  /* meshes and lights*/
  private innerShipCube;
  private pointLight: THREE.PointLight;
  private sunLight: THREE.DirectionalLight;
  private sunLightAngle: number = 0;
  private sunUniforms: any;
  private planetMesh: THREE.Mesh;
  private planetPosition: any = {
    planetPositionX: -33,
    planetPositionY: -35,
    planetPositionZ: -60
  };
  private spotLight: THREE.SpotLight;
  private spotLightSphere: THREE.Mesh;
  private movingLight: THREE.PointLight;
  private movingLightDistance: number = 16.3;
  private movingLightRadius: number = 1;
  private movingLightSpeed: number = 0.99;
  private movingLightDir: number = 1;
  private movingLightAngle: number = 0;
  private movingLightY: number = 20;
  private sky: THREE.Mesh;
  private ship: THREE.Mesh;
  private movingShip: THREE.Mesh;
  private movingShipSpeedFactor: number = 10;
  private movingShipSpeed: number = Math.random() * this.movingShipSpeedFactor;
  private movingShipDir: number = 1;
  private movingShipCurve: Boolean = false;
  private movingShipAngle: number = 0;
  private movingShipRadius: number = 160;

  private stars: Array<THREE.Mesh> = [];
  private starDistance: number = 20;
  private starDistanceX: number = 40;
  private starDistanceY: number = 30;
  private starDistanceZ: number = 30;
  private starPosY: number = -10;
  private starPosZ: number = -30;
  private starOffsetX: number = 0;
  private starOffsetY: number = 0;
  private starOffsetZ: number = 0;

  public fieldOfView: number = 75;
  public nearClippingPane: number = 1;
  public farClippingPane: number = 1100;


  /* RENDERING PROPERTIES */

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  @ViewChild('canvas')
  private canvasRef: ElementRef;

  @ViewChild('generatedStarTexture')
  private generatedStarTextureRef: ElementRef;

  private renderer: THREE.WebGLRenderer;

  /* USER INTERACTION PROPERTIES */

  private isUserInteracting: boolean = false;
  private latitude: number = 0;
  private longitude: number = 0;
  private onPointerDownPointerX: number = 0;
  private onPointerDownPointerY: number = 0;
  private onPointerDownLongitude: number = 0;
  private onPointerDownLatitude: number = 0;
  private phi: number = 0;
  private theta: number = 0;

  /* DEPENDENCY INJECTION (CONSTRUCTOR) */
  constructor() { }

  /* PANELS */
  private panels: Array<any> = [];
  private initPanels() {

    let div, obj;

    div = document.getElementById('panel1');
    div.style.height = (60 / 731) * this.canvas.clientHeight + 'px';
    obj = new THREE.Object3D();
    obj.position.set(-2, 0, 1.3);
    this.scene.add(obj);
    this.panels.push({name: 'leftbottom', div: div, obj: obj, alienText: true});

    div = document.getElementById('panel2');
    div.style.height = (60 / 731) * this.canvas.clientHeight + 'px';
    obj = new THREE.Object3D();
    obj.position.set(1, 0, 1.3);
    this.scene.add(obj);
    this.panels.push({name: 'rightbottom', div: div, obj: obj, alienText: true});

    this.textures['projection'].wrapS = this.textures['projection'].wrapT = THREE.RepeatWrapping;
    this.textures['projection'].repeat.set( 10, 10 );

    const material = new THREE.MeshStandardMaterial({
      map: this.textures['projection'],
      envMap: this.innerShipCube,
      metalness: 1,
      shading: THREE.SmoothShading,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });

    const projection: THREE.Mesh = new THREE.Mesh(this.models['projection'], material);
    this.scene.add(projection);

    

    div = document.getElementById('mainPanel');
    div.style.height = (405 / 731) * this.canvas.clientHeight + 'px';
    obj = new THREE.Object3D();
    obj.position.set(-0.545, 1.47043, 0.71409);
    this.scene.add(obj);
    let obj2 = new THREE.Object3D();
    obj2.position.set(0.545, 1.47043, 0.71409);
    this.panels.push({name: 'main', div: div, obj: obj, obj2: obj2, alienText: false});

    /*
    let h = new THREE.Mesh(new THREE.CubeGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({color: 0xff0000}));
    h.position.set(-0.60737, 1.47043, 0.71409);
    this.scene.add(h);

    if(this.enableGui){
      this.devGui.add( h.position, 'x', -2.0, 0.0, 0.001 );
      this.devGui.add( h.position, 'y', -2.0, 2.0, 0.001 );
      this.devGui.add( h.position, 'z', -2.0, 2.0, 0.001 );
    }
    */
  }

  /* STAGING, ANIMATION, AND RENDERING */

  /**
   * Create the scene.
   */
  private createScene() {
    this.scene = new THREE.Scene();
  }

  /**
   * Create the camera.
   */
  private createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      this.fieldOfView,
      this.getAspectRatio(),
      this.nearClippingPane,
      this.farClippingPane
    );
    //this.camera.position.set( 0, 2, 3.5 );
    this.camera.position.set( 0, 2, 2 );
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.camera.lookAt(this.cameraTarget);
    const cam = this.camera;
    if (this.enableGui) {
      this.devGui.add( this, 'fieldOfView', 0, 120 ).onChange(function(value){
        cam.fov = Number(value);
        cam.updateProjectionMatrix();
      });
    }

  }

  private loadCubeMaps(){
    const r = 'assets/textures/cubemap_ship/';
    const innerShipCubeUrls = [ r + 'east.jpg', r + 'west.jpg', r + 'up.jpg', r + 'down.jpg', r + 'north.jpg', r + 'south.jpg' ];

    this.innerShipCube = new THREE.CubeTextureLoader().load( innerShipCubeUrls );
    this.innerShipCube.format = THREE.RGBFormat;
    this.innerShipCube.mapping = THREE.CubeReflectionMapping;
  }

  private createPlanets() {

    this.sunUniforms = {
      fogDensity: { value: 0.03 },
      fogColor:   { value: new THREE.Vector3( 0, 0, 0 ) },
      time:       { value: 0.1 },
      resolution: { value: new THREE.Vector2() },
      uvScale:    { value: new THREE.Vector2( 1.0, 1.0 ) },
      //uvScale:    { value: new THREE.Vector2( 3.0, 1.0 ) },
      texture1:   { value: this.textures['planetcloud'] },
      texture2:   { value: this.textures['planetsurface'] }
    };

    this.sunUniforms.texture1.value.wrapS = this.sunUniforms.texture1.value.wrapT = THREE.RepeatWrapping;
    this.sunUniforms.texture2.value.wrapS = this.sunUniforms.texture2.value.wrapT = THREE.RepeatWrapping;

    const material = new THREE.ShaderMaterial( {
      uniforms: this.sunUniforms,
      vertexShader: document.getElementById( 'vertexShader' ).textContent,
      fragmentShader: document.getElementById( 'fragmentShader' ).textContent
    } );

    this.planetMesh = new THREE.Mesh( new THREE.SphereGeometry( 40, 64, 64), material );
    this.planetMesh.receiveShadow = true;
    //this.planetMesh.rotation.x = 0.3;
    this.planetMesh.position.set(this.planetPosition.planetPositionX, this.planetPosition.planetPositionY, this.planetPosition.planetPositionZ);
    //this.planetMesh.position.set(-4, -11, -17);
    this.scene.add( this.planetMesh );

    const planetLight = new THREE.PointLight( 0xffffff );
    planetLight.castShadow = true;
    //let planetLightHelper = new THREE.SpotLightHelper( this.spotLight );
    //planetLight.add( planetLightHelper );
    this.planetMesh.add( planetLight );
    planetLight.position.set(0, -50, 0);

    if ( this.enableLightHelpers) {
      planetLight.add( new THREE.PointLightHelper( planetLight, 1 ) );
    }
    
    const m = this.planetMesh;

    if (this.enableGui) {
      this.devGui.add( this.planetPosition, 'planetPositionX', -100, 100 ).onChange(function(value){
        m.position.x = value;
      });
      this.devGui.add( this.planetPosition, 'planetPositionY', -100, 100 ).onChange(function(value){
        m.position.y = value;
      });
      this.devGui.add( this.planetPosition, 'planetPositionZ', -100, 100 ).onChange(function(value){
        m.position.z = value;
      });
    }

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
          //value: this.movingLight.position
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

    const planetGlow = new THREE.Mesh( new THREE.SphereGeometry( 40.1, 64, 64), planetGlowMaterial );
    this.planetMesh.add(planetGlow);

  }

  private createLights() {

    this.scene.add( new THREE.AmbientLight( 0x808080 ) );

    
    //this.sunLight = new THREE.SpotLight( 0xffffff );
    this.sunLight = new THREE.DirectionalLight(0xEDC618, 1);
    // spotLight.position.set( 50, 100, 50 );
    this.sunLight.position.set( -1, 3, -5 );
    //this.spotLight.angle = Math.PI / 7;
    //this.sunLight.penumbra = 0.8;
    this.sunLight.castShadow = true;
    this.sunLight.shadow.bias = 0.0001;
    // spotLight.shadowDarkness = 0.2; removed
    this.sunLight.shadow.mapSize.width = this.shadowMapSize;
    this.sunLight.shadow.mapSize.height = this.shadowMapSize;
    //this.sunLight.distance = 1000;
    // spotLight.shadow.camera.near = 2;       // default 0.5
    // spotLight.shadow.camera.far = 100;      // default 500
    this.scene.add( this.sunLight );

    if ( this.enableLightHelpers) {
      this.sunLight.add( new THREE.DirectionalLightHelper( this.sunLight ) );
    }

    this.sunLight.lookAt(this.planetMesh.position);

    this.spotLight = new THREE.SpotLight( 0x76C6E8 );
    // spotLight.position.set( 50, 100, 50 );
    this.spotLight.position.set( 10, 3, 10 );
    //this.spotLight.angle = Math.PI / 7;
    this.spotLight.penumbra = 0.8;
    this.spotLight.castShadow = true;
    this.spotLight.shadow.bias = 0.0001;
    // spotLight.shadowDarkness = 0.2; removed
    this.spotLight.shadow.mapSize.width = this.shadowMapSize;
    this.spotLight.shadow.mapSize.height = this.shadowMapSize;
    this.spotLight.distance = 1000;
    // spotLight.shadow.camera.near = 2;       // default 0.5
    // spotLight.shadow.camera.far = 100;      // default 500
    this.scene.add( this.spotLight );

    if ( this.enableLightHelpers) {
      this.spotLight.add( new THREE.SpotLightHelper( this.spotLight ) );
    }

    //this.spotLight.lookAt(this.cameraTarget);
    this.spotLight.lookAt(this.planetMesh.position);

    this.movingLight = new THREE.PointLight(0x00BFFF, 1);
    
    this.movingLight.castShadow = true;
    this.movingLight.shadow.mapSize.width = this.shadowMapSize;
    this.movingLight.shadow.mapSize.height = this.shadowMapSize;
    this.movingLight.position.set( -this.movingLightDistance, 1, 2.8 );
    this.scene.add( this.movingLight );

    if ( this.enableLightHelpers) {
      this.movingLight.add( new THREE.PointLightHelper( this.movingLight, 0.5 ) );
    }

  }

  private getRandomStarField(numberOfStars, width, height) {
    let generatedStarTextureElement = this.generatedStarTextureRef.nativeElement;
    generatedStarTextureElement.width = width;
    generatedStarTextureElement.height = height;

    let ctx = generatedStarTextureElement.getContext('2d');
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

    const tex = new THREE.Texture(generatedStarTextureElement);
    tex.needsUpdate = true;
    return tex;
  };

  private createBox() {
    const skyBox = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyBoxMaterial = new THREE.MeshBasicMaterial({
      map: this.getRandomStarField(600, 2048, 2048),
      side: THREE.BackSide
    });
    this.sky = new THREE.Mesh(skyBox, skyBoxMaterial);
    this.scene.add(this.sky);
  }

  private createShip() {

    const texture = this.textures['ship'];
    //texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    //texture.repeat.set( 2, 2 );

    const ship_bump = this.textures['ship_bump'];
    //ship_bump.wrapS = texture.wrapT = THREE.RepeatWrapping;
    //ship_bump.repeat.set( 10, 10 );

    const shipMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          //bumpMap: ship_bump,
          //bumpScale: 0.001,
          //bumpScale: 0.01,
          envMap: this.innerShipCube,
          metalness: 1,
          shading: THREE.SmoothShading,
          side: THREE.DoubleSide
    });
    const ship = new THREE.Mesh(this.models['ship'], shipMaterial);
    ship.receiveShadow = true;
    ship.castShadow = true;
    this.scene.add(ship);
  }

  private createFlyByShip() {

    const texture = this.textures['ship'];
    //texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    //texture.repeat.set( 2, 2 );

    //let ship_bump = this.textures['ship_bump'];
    //ship_bump.wrapS = texture.wrapT = THREE.RepeatWrapping;
    //ship_bump.repeat.set( 10, 10 );

    const shipMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          //bumpMap: ship_bump,
          //bumpScale: 0.001,
          //bumpScale: 0.01,
          envMap: this.innerShipCube,
          metalness: 1,
          shading: THREE.SmoothShading,
          side: THREE.DoubleSide
    });
    const ship = new THREE.Mesh(this.models['ship_complete'], shipMaterial);
    ship.receiveShadow = true;
    ship.castShadow = true;
    ship.scale.set(0.1, 0.1, 0.1);
    ship.position.set(-50, -5, -19);
    // x min -50 max 50
    // y min -17 max -2
    // z min -17 max -2
    this.scene.add(ship);

    this.movingShip = ship;

  }

  private motherShip: THREE.Mesh;
  private motherShipLight: THREE.PointLight;
  private motherShipRing1: THREE.Mesh;
  private motherShipRing2: THREE.Mesh;
  //private motherShipDrones: Array<THREE.Mesh> = [];

  private createMotherShip() {

    const texture = this.textures['ship'];
    const shipMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          envMap: this.innerShipCube,
          metalness: 1,
          shading: THREE.SmoothShading,
          side: THREE.DoubleSide
    });
    const ship = new THREE.Mesh(this.models['mothership'], shipMaterial);
    ship.receiveShadow = true;
    ship.castShadow = true;
    ship.scale.set(2, 2, 2);
    ship.position.set(4, -15, -44);
    ship.rotateY(-30 * Math.PI / 180);
    this.scene.add(ship);

    this.motherShip = ship;

    this.motherShipLight = new THREE.PointLight(0x00BFFF, 1);
    this.motherShipLight.castShadow = true;
    this.motherShipLight.shadow.mapSize.width = this.shadowMapSize;
    this.motherShipLight.shadow.mapSize.height = this.shadowMapSize;
    this.motherShipLight.position.set( 0, 0, 0 );
    ship.add(this.motherShipLight);
    if ( this.enableLightHelpers) {
      this.motherShipLight.add( new THREE.PointLightHelper( this.motherShipLight, 0.5 ) );
    }

    this.motherShipRing1 = new THREE.Mesh(this.models['mothership_ring1'], shipMaterial);
    this.motherShipRing1.receiveShadow = true;
    this.motherShipRing1.castShadow = true;
    //this.motherShipRing1.scale.set(1, 1, 1);
    ship.add(this.motherShipRing1);
    this.motherShipRing2 = new THREE.Mesh(this.models['mothership_ring2'], shipMaterial);
    this.motherShipRing2.receiveShadow = true;
    this.motherShipRing2.castShadow = true;
    //this.motherShipRing2.scale.set(1, 1, 1);
    ship.add(this.motherShipRing2);

    // drones
    // starting z-positions 4 and 6
    let drone: THREE.Mesh;
    for (let i = 0; i < 10; i++) {
      drone = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), shipMaterial);
      drone.position.set(0, 0, 4);
      //this.motherShipDrones.push(drone);
      ship.add(drone);
      this.animateMotherShipDrone(drone);
      
    }

  }

  private animateMotherShipDrone(drone) {
    let haven = Math.round(Math.random());
    let havenZ = haven === 0 ? 4 : 6;
    let leaveOrDock = Math.round(Math.random());
    let bezier;
    if (haven === 0) {
      drone.position.z = 4;
    } else {
      drone.position.z = 6;
    }
    if (leaveOrDock === 0) { // 0 = leave, 1 = dock
      drone.position.x = 0;
      bezier = [
        {x: this.randomIntFromInterval(5, 10), z: havenZ},
        {x: this.randomIntFromInterval(50, 500), z: this.randomIntFromInterval(-500, 500)},
        {x: this.randomIntFromInterval(500, 1000), z: this.randomIntFromInterval(-1000, 1000)}
      ];
    } else {
      bezier = [
        {x: this.randomIntFromInterval(500, 1000), z: this.randomIntFromInterval(-1000, 1000)},
        {x: this.randomIntFromInterval(100, 500), z: this.randomIntFromInterval(-500, 500)},
        {x: this.randomIntFromInterval(5, 10), z: havenZ},
        {x: 0, z: havenZ}
      ];
      drone.position.x = bezier[0].x;
      drone.position.z = bezier[0].z;
    }

    const ref = this;
    const time = this.randomIntFromInterval(10, 20);
    TweenMax.to(drone.position, time, {
      bezier: {
        type: 'soft',
        values: bezier
      },
      delay: this.randomIntFromInterval(5, 20),
      ease: leaveOrDock === 0 ? Power2.easeIn : Power2.easeOut,
      onComplete: () => {
        ref.animateMotherShipDrone(drone);
    }});
  }

  private createGlas() {

    const material = new THREE.MeshStandardMaterial({
          map: this.textures['glas'],
          bumpMap: this.textures['glas_bump'],
          bumpScale: 0.1,
          envMap: this.innerShipCube,
          metalness: 1,
          shading: THREE.SmoothShading,
          side: THREE.DoubleSide,
          transparent: true//,
          //alphaTest: 0.5,
          //opacity: 0.5
    });

    const glas = new THREE.Mesh(this.models['glas'], material);
    glas.receiveShadow = true;
    glas.castShadow = true;
    this.scene.add(glas);
  }

  private createHyperspeed() {

    let texture = this.textures['star'];
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 1 );

    let material = new THREE.MeshBasicMaterial( {
      map: this.textures['star'],
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.5
    } );

    for ( let i = 0; i < 1000; i++ ) {
      const star: THREE.Mesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.2), material);
      //star.rotation.set(90 * Math.PI / 180, 0, 0);
      // star.rotation.x = 90 * Math.PI / 180;
      const x = -this.starDistanceX + Math.random() * this.starDistanceX * 2;
      const y = this.starPosY + Math.random() * this.starDistanceY;
      const z = this.starPosZ + Math.random() * this.starDistanceZ;
      star.position.set(x, y, z);
      this.stars.push( star );
      this.scene.add( star );
    }

  }

  /**
   * Get aspect ratio of the view.
   */
  private getAspectRatio(): number {
    const height = this.canvas.clientHeight;

    if (height === 0) {
      return 0;
    }

    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  /**
   * Rotate the camera.
   */
  private rotateCamera() {
    if (this.isUserInteracting === false) {
      // this.longitude += 0.1;
    }

    this.latitude = Math.max(-85, Math.min(85, this.latitude));
    this.phi = THREE.Math.degToRad(90 - this.latitude);
    this.theta = THREE.Math.degToRad(this.longitude);

    this.cameraTarget.x = 500 * Math.sin(this.phi) * Math.cos(this.theta);
    this.cameraTarget.y = 500 * Math.cos(this.phi);
    this.cameraTarget.z = 500 * Math.sin(this.phi) * Math.sin(this.theta);

    this.camera.lookAt(this.cameraTarget);
  }

  private rotateSkybox() {
    this.latitude = Math.max(-85, Math.min(85, this.latitude));
    this.phi = THREE.Math.degToRad(90 - this.latitude);
    this.theta = THREE.Math.degToRad(this.longitude);

    this.sky.rotation.x += 0.0001;
    this.sky.rotation.y += 0.0001;
  }

  private animateSun() {
    const now: Date = new Date();
    /*
    let secondsADay: number = 24 * 60 * 60;
    let seconds = now.getHours() * 60 * 60 + now.getMinutes() * 60 + now.getSeconds();
    let degree = percentual / 100 * 360;
    degree += 180;
    degree = degree > 360 ? degree - 360 : degree;
    let rad = degree * Math.PI / 180;
    this.sunLight.position.x = 10 * Math.sin( rad );
    this.sunLight.position.y = 10 * Math.cos( rad );
    */

    var delta = 5 * this.clock.getDelta();
    this.sunUniforms.time.value += 0.01 * delta;
    this.planetMesh.rotation.y += 0.005 * delta;
    // this.planetMesh.rotation.x += 0.05 * delta;

    this.sunLightAngle += 0.001;
    this.sunLight.position.x = 10 * Math.sin( this.sunLightAngle );
    this.sunLight.position.y = 10 * Math.cos( this.sunLightAngle );

    // this.sunLight.lookAt(this.cameraTarget);
    this.sunLight.lookAt(this.planetMesh.position);
  }

  private moveLights() {

    this.movingLight.position.x = this.movingLightRadius * Math.sin( this.movingLightAngle );
    this.movingLight.position.z = this.movingLightDistance + this.movingLightRadius * Math.cos( this.movingLightAngle );
    this.movingLight.position.y = this.movingLightY;
    this.movingLightAngle += this.movingLightSpeed;
  }

  private moveStars() {
    if (this.stars.length) {
      for (let i = 0; i < this.stars.length; i++) {
        let star = this.stars[i];
        star.position.x -= Math.abs(star.position.z) / 10;
        if (star.position.x < -this.starDistanceX) {
          const x = this.starDistanceX;
          const y = this.starPosY + Math.random() * this.starDistanceY;
          const z = this.starPosZ + Math.random() * this.starDistanceZ;
          star.position.set(x, y, z);
        }
        star.position.x += this.starOffsetX;
        star.position.y += this.starOffsetY;
        star.position.z += this.starOffsetZ;
      }
    }
  }

  private animateMotherShip() {
    this.motherShipRing1.rotation.z += 0.1;
    this.motherShipRing2.rotation.x -= 0.1;
    //this.motherShip.position.x += 0.001;
    //this.motherShip.position.z -= 0.001;
  }

  private randomIntFromInterval(min, max) {
      return Math.floor(Math.random() * ( max - min + 1 ) + min);
  }

  private toScreenPosition(obj, camera) {
    const vector = new THREE.Vector3();
    // TODO: need to update this when resize window
    const widthHalf = 0.5 * this.renderer.context.canvas.width;
    const heightHalf = 0.5 * this.renderer.context.canvas.height;

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

  private initComposer() {

      this.renderPass = new EffectComposer.RenderPass(this.scene, this.camera);
      // renderPass.clear = true;
      this.effectFXAA = new EffectComposer.ShaderPass(FXAAShader);
      this.effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight );

      // smaaPass = new THREE.SMAAPass( window.innerWidth, window.innerHeight );
      // smaaPass.renderToScreen = true;


      const copyShader = new EffectComposer.ShaderPass(EffectComposer.CopyShader);
      copyShader.renderToScreen = true;


      let resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
      this.bloomPass = new UnrealBloomPass(resolution, this.bloomParams.strength, this.bloomParams.radius, this.bloomParams.threshold);
      //const bloomPass = new BloomPass(3, 100, 100, 256);
      // let filmPass = new FilmPass(0.8, 0.325, 256, false);
      // filmPass.renderToScreen = true;



      this.composer = new EffectComposer(this.renderer);
      this.composer.setSize(window.innerWidth, window.innerHeight);
      this.composer.addPass(this.renderPass);
      this.composer.addPass(this.effectFXAA);
      this.composer.addPass(this.bloomPass);
      // this.composer.addPass(filmPass);
      this.composer.addPass(copyShader);
      // composer.addPass( smaaPass );

      if (this.enableGui) {
        this.devGui.add( this.bloomParams, 'exposure', 0.1, 5 );
        this.devGui.add( this.bloomParams, 'threshold', 0.0, 1.0 ).onChange( function(value) {
          this.bloomPass.threshold = Number(value);
        });
        this.devGui.add( this.bloomParams, 'strength', 0.0, 10.0 ).onChange( function(value) {
          this.bloomPass.strength = Number(value);
        });
        this.devGui.add( this.bloomParams, 'radius', 0.0, 1.0 ).onChange( function(value) {
          this.bloomPass.radius = Number(value);
        });
      }

  }

  private randomPanelStrings: Array<string> = ['&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp', '&nbsp'];

  private animatePanels() {
    let proj, shouldAddNewLine: Boolean, line: Element, div: HTMLDivElement, numChars: number, str: string;

    //const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const charsArray = chars.split('');

    for (let i = 0; i < this.panels.length; i++) {

      div = this.panels[i].div;
      proj = this.toScreenPosition(this.panels[i].obj, this.camera);
      div.style.left = proj.x + 'px';
      div.style.top = proj.y + 'px';

      // main correction
      if (this.panels[i].name === 'main') {
        let proj2 = this.toScreenPosition(this.panels[i].obj2, this.camera);
        div.style.width = proj2.x - proj.x + 'px';
        //div.style.height = ((405 / 731) * this.canvas.clientHeight) - Math.abs(this.camera.position.y) + 'px';
      }

      if (this.panels[i].alienText) {
        shouldAddNewLine = this.randomIntFromInterval(0, 10) === 0 ? true : false;
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

    // projection
    this.textures['projection'].offset.y += 0.01;

  }

  /**
   * Start the rendering loop.
   */
  private startRendering() {

    console.log(this.canvas.clientWidth+'x'+this.canvas.clientHeight);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.gammaInput = true;
    this.renderer.gammaOutput = true;
		// this.renderer.antialias = true;

    this.initComposer();

    const component: SceneComponent = this;

    (function render() {
      requestAnimationFrame(render);

      // component.rotateCamera();
      component.rotateSkybox();
      component.animateSun();
      component.moveLights();
      if (component.enableMovingStars) component.moveStars();
      component.animateMotherShip();

      component.animatePanels();

      if (component.spotLight) {
        component.spotLight.lookAt(component.planetMesh.position);
      }
      // component.renderer.toneMappingExposure = Math.pow( component.bloomParams.exposure, 4.0 );
      // component.renderer.render(component.scene, component.camera);
      component.renderer.clear();
      // component.composer.render( 0.01 );
      component.composer.render(component.clock.getDelta());
      // component.composer.render();
    }());
  }



  /* EVENTS */

  public onDragEnter(event: DragEvent) {
    this.canvas.style.opacity = 0.5.toString();
  }

  public onDragLeave(event: DragEvent) {
    this.canvas.style.opacity = 1.0.toString();
  }

  public onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  public onDrop(event: DragEvent) {
    event.preventDefault();

    const component: SceneComponent = this;
    const reader = new FileReader();
    reader.addEventListener('load', function onDroppedFileLoad() {
      // component.material.map.image.src = reader.result;
      // component.material.map.needsUpdate = true;
    });
    reader.readAsDataURL(event.dataTransfer.files[0]);

    this.canvas.style.opacity = 1.0.toString();
  }

  public onMouseDown(event: MouseEvent) {
    event.preventDefault();

    this.isUserInteracting = true;
    this.onPointerDownPointerX = event.clientX;
    this.onPointerDownPointerY = event.clientY;
    this.onPointerDownLatitude = this.latitude;
    this.onPointerDownLongitude = this.longitude;
  }

  public onMouseMove(event: MouseEvent) {
    if (this.isUserInteracting !== true) {
      // Propagate event
      return true;
    }

    this.latitude = (event.clientY - this.onPointerDownPointerY) * 0.1 +
      this.onPointerDownLatitude;
    this.longitude = (this.onPointerDownPointerX - event.clientX) * 0.1 +
      this.onPointerDownLongitude;
  }

  public onMouseUp(event: MouseEvent) {
    this.isUserInteracting = false;
  }

  public onWheel(event: MouseWheelEvent) {
    if (this.camera) {
      this.camera.position.z += event.deltaY * 0.01;
      this.camera.updateProjectionMatrix();
    }
  }

  public onResize(event: Event) {

    this.canvas.width  = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    //this.renderer.setViewport(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);


    if (this.camera) {
      this.camera.aspect = this.getAspectRatio();
      this.camera.updateProjectionMatrix();
    }

    if (this.effectFXAA) {
      this.effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight );
    }

    if (this.bloomPass) {
      this.bloomPass.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }

    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.composer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    console.log(this.canvas.clientWidth + 'x' + this.canvas.clientHeight);

    document.getElementById('panel1').style.height = (60 / 731) * this.canvas.clientHeight + 'px';
    document.getElementById('panel2').style.height = (60 / 731) * this.canvas.clientHeight + 'px';

  }

  /* LOAD */

  public preload() {
    const component: SceneComponent = this;
    if (this.loadTextures.length) {
      this.textureLoading = this.loadTextures.pop();
      this.textureLoader.load( this.textureLoading.file, function( map ) {
        component.textures[component.textureLoading.name] = map;
        component.preload();
      });
    } else if (this.loadModels.length) {
      this.modelLoading = this.loadModels.pop();
      this.jsonLoader.load( this.modelLoading.file, function( geo ) {
        component.models[component.modelLoading.name] = geo;
        component.preload();
      });
    } else {
      console.log(this.textures);
      console.log(this.models);
      this.initScene();
    }
  }

  private animateCamera() {
    if (!this.camera.userData.hasOwnProperty('initialPosX')) {
      this.camera.userData.initialPosX = this.camera.position.x;
      this.camera.userData.initialPosY = this.camera.position.y;
      this.camera.userData.initialPosZ = this.camera.position.z;
    }
    const dist = 0.02;
    const xmin = this.camera.userData.initialPosX - dist;
    const xmax = this.camera.userData.initialPosX + dist;
    const ymin = this.camera.userData.initialPosY - dist;
    const ymax = this.camera.userData.initialPosY + dist;
    const ref = this;
    const time = this.randomIntFromInterval(1, 3);
    TweenMax.to(this.camera.position, time, {
        bezier: [
          {x: this.randomIntFromInterval(xmin * 1000, xmax * 1000) / 1000, y: this.randomIntFromInterval(ymin * 1000, ymax * 1000) / 1000},
          {x: this.randomIntFromInterval(xmin * 1000, xmax * 1000) / 1000, y: this.randomIntFromInterval(ymin * 1000, ymax * 1000) / 1000}
        ],
        ease: Power2.easeInOut,
        onComplete: () => {
          ref.animateCamera();
      }});
  }

  private animateFlyBy() {

    const xmin = -50;
    const xmax = 50;
    const ymin = -10;
    const ymax = 0;
    const zmin = -10;
    const zmax = -2;

    let s: THREE.Mesh = this.movingShip;
    this.movingShip.position.y = this.randomIntFromInterval(ymin, ymax);
    this.movingShip.position.z = this.randomIntFromInterval(zmin, zmax);

    let type = this.randomIntFromInterval(0, 3);
    let dir = this.randomIntFromInterval(0, 1);

    let time1 = dir === 0 ? this.randomIntFromInterval(2, 10) : this.randomIntFromInterval(1, 2);
    let time2 = dir === 0 ? this.randomIntFromInterval(1, 2) : this.randomIntFromInterval(2, 10);

    let params: Array<Array<number>> = [];
    switch (dir) {
      case 0:
        this.movingShip.position.x = xmin;
        switch (type) {
          case 0:
            params.push([this.randomIntFromInterval(-2, 2), this.randomIntFromInterval(zmin, zmax)]);
            params.push([xmax, this.randomIntFromInterval(zmin, zmax)]);
            break;
          case 1:
            params.push([this.randomIntFromInterval(-2, 2), this.randomIntFromInterval(ymin, ymax)]);
            params.push([xmax, this.randomIntFromInterval(ymin, ymax)]);
            break;
          case 2:
            params.push([this.randomIntFromInterval(xmin / 2 - 2, xmin / 2 + 2), this.randomIntFromInterval(ymin, ymax)]);
            params.push([this.randomIntFromInterval(-2, 2), this.randomIntFromInterval(ymin, ymax)]);
            params.push([this.randomIntFromInterval(xmax / 2 - 2, xmax / 2 + 2), this.randomIntFromInterval(ymin, ymax)]);
            params.push([xmax, this.randomIntFromInterval(ymin, ymax)]);
            break;
          case 3:
            params.push([this.randomIntFromInterval(xmin / 2 - 2, xmin / 2 + 2), this.randomIntFromInterval(zmin, zmax)]);
            params.push([this.randomIntFromInterval(-2, 2), this.randomIntFromInterval(zmin, zmax)]);
            params.push([this.randomIntFromInterval(xmax / 2 - 2, xmax / 2 + 2), this.randomIntFromInterval(zmin, zmax)]);
            params.push([xmax, this.randomIntFromInterval(zmin, zmax)]);
            break;
        }
        break;
      case 1:
        this.movingShip.position.x = xmax;
        switch (type) {
          case 0:
            params.push([this.randomIntFromInterval(-2, 2), this.randomIntFromInterval(zmin, zmax)]);
            params.push([xmin, this.randomIntFromInterval(zmin, zmax)]);
            break;
          case 1:
            params.push([this.randomIntFromInterval(-2, 2), this.randomIntFromInterval(ymin, ymax)]);
            params.push([xmin, this.randomIntFromInterval(ymin, ymax)]);
            break;
          case 2:
            params.push([this.randomIntFromInterval(xmax / 2 - 2, xmax / 2 + 2), this.randomIntFromInterval(ymin, ymax)]);
            params.push([this.randomIntFromInterval(-2, 2), this.randomIntFromInterval(ymin, ymax)]);
            params.push([this.randomIntFromInterval(xmin / 2 - 2, xmin / 2 + 2), this.randomIntFromInterval(ymin, ymax)]);
            params.push([xmin, this.randomIntFromInterval(ymin, ymax)]);
            break;
          case 3:
            params.push([this.randomIntFromInterval(xmax / 2 - 2, xmax / 2 + 2), this.randomIntFromInterval(zmin, zmax)]);
            params.push([this.randomIntFromInterval(-2, 2), this.randomIntFromInterval(zmin, zmax)]);
            params.push([this.randomIntFromInterval(xmin / 2 - 2, xmin / 2 + 2), this.randomIntFromInterval(zmin, zmax)]);
            params.push([xmin, this.randomIntFromInterval(zmin, zmax)]);
            break;
        }
    }

    // shootaway
    let secondBezier;
    let shootaway = Math.round(Math.random());
    //shootaway = 1;
    if (type === 2 || type === 3) {
      if (shootaway === 1) {
        dir = this.randomIntFromInterval(0, 1);
        time1 = dir === 0 ? this.randomIntFromInterval(2, 10) : this.randomIntFromInterval(1, 2);
        time2 = dir === 0 ? this.randomIntFromInterval(1, 2) : this.randomIntFromInterval(2, 10);
        if (dir === 0) {
          secondBezier = [
            {x: 10, z: -this.randomIntFromInterval(30, 70)},
            {x: this.randomIntFromInterval(1, 5), z: -1000}
          ];
        } else {
          secondBezier = [
            {x: -70, z: -50},
            {x: -50, z: -1000}
          ];
        }
      }
    }

    // const type: number = 2;
    //const ease = Linear.easeNone;
    const easeOut = Power2.easeOut;
    const easeIn = Power2.easeIn;
    const ref = this;
    if (type === 0) {
      TweenMax.to(this.movingShip.position, time1, {
        bezier: [
          {x: params[0][0], z: params[0][1]},
          {x: params[1][0], z: params[1][1]}
        ],
        ease: easeOut,
        onComplete: () => {
          setTimeout(() => {
            ref.animateFlyBy();
          }, this.randomIntFromInterval(2000, 10000));
      }});
    } else if (type === 1) {
      TweenMax.to(this.movingShip.position, time1, {
        bezier: [
          {x: params[0][0], y: params[0][1]},
          {x: params[1][0], y: params[1][1]}
        ],
        ease: easeOut,
        onComplete: () => {
          setTimeout(() => {
            ref.animateFlyBy();
          }, this.randomIntFromInterval(2000, 10000));
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
          /*TweenMax.to(this.movingShip.position, this.randomIntFromInterval(1, 3), {
            bezier: [
              {x: params[1][0] + (this.randomIntFromInterval(1, 3) * ( dir === 1 ? 1 : 0)), y: params[1][1] + (this.randomIntFromInterval(1, 3) * ( dir === 1 ? 1 : 0))}
            ],
            ease: ease,
            onComplete: () => {*/
              TweenMax.to(this.movingShip.position, time2, {
                bezier: secondBezier,
                ease: easeIn,
                onComplete: () => {
                  setTimeout(() => {
                    ref.animateFlyBy();
                  }, this.randomIntFromInterval(2000, 10000));
                }
              });
            /*}
          });*/
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
          /*TweenMax.to(this.movingShip.position, this.randomIntFromInterval(1, 3), {
            bezier: [
              {x: params[1][0] + (this.randomIntFromInterval(1, 3) * ( dir === 1 ? 1 : 0)), z: params[1][1] + (this.randomIntFromInterval(1, 3) * ( dir === 1 ? 1 : 0))}
            ],
            ease: ease,
            onComplete: () => {*/
              TweenMax.to(this.movingShip.position, time2, {
                bezier: secondBezier,
                ease: easeIn,
                onComplete: () => {
                  setTimeout(() => {
                    ref.animateFlyBy();
                  }, this.randomIntFromInterval(2000, 10000));
                }
              });
            /*}
          });*/
        }
      });
    }

  }

  

  /* INIT */
  private initScene() {
    console.log('initScene()');
    if (this.enableGui) {
      this.devGui = new DAT.GUI();
    }

    this.loadCubeMaps();
    this.createScene();
    this.createCamera();
    this.createPlanets();
    this.createLights();
    this.createBox();
    this.createShip();
    this.createGlas();
    this.createFlyByShip();
    this.createMotherShip();
    if (this.enableMovingStars) { this.createHyperspeed(); }
    this.startRendering();

    this.initPanels();

    this.animateFlyBy();
    this.animateCamera();

    if (this.enableGui) {
      this.devGui.open();
    }

  }

  /* LIFECYCLE */

  ngAfterViewInit() {
    this.preload();
  }

}
