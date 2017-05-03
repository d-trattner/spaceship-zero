import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
  HostListener
} from '@angular/core';

import * as THREE from 'three';

import { PreloadeffectService } from '../three/preloadeffect.service';
import { UtilsService } from '../three/utils.service';
import { AssetService } from '../three/asset.service';
import { CameraService } from '../three/camera.service';
import { PlanetService } from '../three/planet.service';
import { LightService } from '../three/light.service';
import { SkyboxService } from '../three/skybox.service';
import { ShipService } from '../three/ship.service';
import { PanelService } from '../three/panel.service';
import { AsteroidService } from '../three/asteroid.service';

import {TweenMax, Power2, Linear, TimelineLite} from 'gsap';

const EffectComposer = require('three-effectcomposer')(THREE);

const FXAAShader = require('../shaders/FXAAShader.js')(THREE);
const BloomPass = require('../shaders/BloomPass.js')(THREE);
const FilmShader = require('../shaders/FilmShader.js')(THREE);
const FilmPass = require('../shaders/FilmPass.js')(THREE);

const UnrealBloomPass = require('../postprocessing/UnrealBloomPass.js')(THREE);

const DAT = require('dat-gui');

@Component({
  selector: 'app-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.css']
})

export class SceneComponent implements AfterViewInit {

  @ViewChild('canvas')
  private canvasRef: ElementRef;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  /* DEV */
  private enableGui: Boolean = false;

  /* STAGE PROPERTIES */

  public clock: THREE.Clock = new THREE.Clock();

  private devGui: any;

  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private renderPass: any;
  private composer: any;
  private effectFXAA: any;
  private bloomPass: any;

  private bloomParams = {
    projection: 'normal',
    background: false,
    exposure: 0.72,
    threshold: 0.7,
    strength: 5.74,
    radius: 0
  };

  constructor(
    public preloadeffectService: PreloadeffectService,
    public utils: UtilsService,
    public assets: AssetService,
    public cameraService: CameraService,
    public planetService: PlanetService,
    public lightService: LightService,
    public skyboxService: SkyboxService,
    public shipService: ShipService,
    public panelService: PanelService,
    public asteroidService: AsteroidService
  ) {}

  private createScene() {
    this.scene = new THREE.Scene();
  }

  private initComposer() {

      this.renderPass = new EffectComposer.RenderPass(this.scene, this.cameraService.camera);
      // renderPass.clear = true;
      this.effectFXAA = new EffectComposer.ShaderPass(FXAAShader);
      this.effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight );

      // smaaPass = new THREE.SMAAPass( window.innerWidth, window.innerHeight );
      // smaaPass.renderToScreen = true;


      const copyShader = new EffectComposer.ShaderPass(EffectComposer.CopyShader);
      copyShader.renderToScreen = true;


      const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
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

      /*
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
      */

  }

  /**
   * Start the rendering loop.
   */
  private startRendering() {

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.gammaInput = true;
    this.renderer.gammaOutput = true;
		// this.renderer.antialias = true;

    this.initComposer();

    const ref: SceneComponent = this;

    (function render() {
      requestAnimationFrame(render);

      if (ref.assets.isPreloaded) {
        ref.skyboxService.animate();
        ref.planetService.animate(ref.clock);
        ref.lightService.animate();
        ref.shipService.animate();
        ref.panelService.animate();
        ref.asteroidService.animate();
      } else {
        ref.preloadeffectService.animate();
      }
      //ref.renderer.toneMappingExposure = Math.pow( ref.bloomParams.exposure, 4.0 );
      // ref.renderer.render(ref.scene, ref.camera);
      ref.renderer.clear();
      // ref.composer.render( 0.01 );
      ref.composer.render(ref.clock.getDelta());
      // ref.composer.render();
    }());
  }



  /****************************************************************************************
   *  EVENTS
   ****************************************************************************************/

  @HostListener('window:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    //console.log(event, event.keyCode, event.char);
    if (event.key === '1') {
      this.cameraService.toCam1();
    }
    if (event.key === '2') {
      this.cameraService.toCam2();
    }
    if (event.key === '3') {
      this.cameraService.toCam3();
    }

    if (event.key === '1' || event.key === '2'  || event.key === '3') {
      this.initComposer();
    }
  }

  public onKeyPress(event: KeyboardEvent) {
    //console.log(event, event.keyCode, event.char);

  }

  public onDragEnter(event: DragEvent) {

  }

  public onDragLeave(event: DragEvent) {

  }

  public onDragOver(event: DragEvent) {

  }

  public onDrop(event: DragEvent) {

  }

  public onMouseDown(event: MouseEvent) {

  }

  public onMouseMove(event: MouseEvent) {

  }

  public onMouseUp(event: MouseEvent) {

  }

  public onWheel(event: MouseWheelEvent) {
    /*
    if (this.cameraService.camera) {
      this.cameraService.camera.position.z += event.deltaY * 0.01;
      this.cameraService.update();
    }
    */
  }

  public onResize(event: Event) {

    this.canvas.width  = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    //this.renderer.setViewport(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);


    if (this.cameraService.camera) {
      this.cameraService.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
      this.cameraService.camera.updateProjectionMatrix();
    }

    if (this.effectFXAA) {
      this.effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight );
    }

    if (this.bloomPass) {
      this.bloomPass.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }

    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.composer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    //console.log(this.canvas.clientWidth + 'x' + this.canvas.clientHeight);

    document.getElementById('panel1').style.height = (60 / 731) * this.canvas.clientHeight + 'px';
    document.getElementById('panel2').style.height = (60 / 731) * this.canvas.clientHeight + 'px';

  }

  /****************************************************************************************
   *  INIT
   ****************************************************************************************/
  private initScene() {

    if (this.enableGui) {
      this.devGui = new DAT.GUI();
    }

    this.createScene();
    this.cameraService.create(this.scene, this.canvas);
    this.cameraService.beforeIntro();
    this.startRendering();

    this.cameraService.animate();

    if (this.enableGui) {
      this.devGui.open();
    }

  }

  private afterPreload() {

    this.planetService.create(this.scene);
    this.lightService.create(this.scene);
    this.skyboxService.create(this.scene);
    this.shipService.create(this.scene);
    this.panelService.create(this.scene, this.canvas);
    this.asteroidService.create(this.scene);

    this.preloadeffectService.destroy();
    this.cameraService.intro();

  }

  /* LIFECYCLE */

  ngAfterViewInit() {
    this.assets.preloadDone$.subscribe(() => {
      this.afterPreload();
    });

    this.preloadeffectService.create();

    this.assets.start();
    this.initScene();
  }

}
