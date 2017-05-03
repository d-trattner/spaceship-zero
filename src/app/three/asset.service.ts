import { Injectable, EventEmitter } from '@angular/core';

import * as THREE from 'three';

interface IDictionary {
    [key: string]: any;
};

@Injectable()
export class AssetService {
  constructor() {
    this.preloadDone$ = new EventEmitter();
  }

  // tslint:disable-next-line:member-ordering
  public preloadDone$: EventEmitter<any>;

  public isPreloaded: Boolean = false;

  private jsonLoader = new THREE.JSONLoader();
  private textureLoader = new THREE.TextureLoader();
  private cubemapLoader = new THREE.CubeTextureLoader();

  private tDir: String = 'assets/textures/';
  private loadTextures: Array<any> = [
    {name: 'ship', file: this.tDir + 'ship/ship3.jpg'},
    {name: 'ship_bump', file: this.tDir + 'ship/ship3_bump.jpg'},
    {name: 'glas', file: this.tDir + 'ship/glas_uv.png'},
    {name: 'glas_bump', file: this.tDir + 'ship/glas_uv_bump.jpg'},
    {name: 'wormhole', file: this.tDir + 'ship/wormhole.png'},
    {name: 'star', file: this.tDir + 'star_moving.png'},
    {name: 'planetcloud', file: this.tDir + 'planet/cloud.png'},
    {name: 'planetsurface', file: this.tDir + 'planet/surface.jpg'},
    {name: 'projection', file: this.tDir + 'projection.png'},
    {name: 'planet_ring', file: this.tDir + 'planet/planet_ring.png'},
    {name: 'nebula', file: this.tDir + 'nebula.png'}
  ];
  private textureLoading: any;
  private textures: IDictionary = {};

  private mDir: String = 'assets/models/';
  private loadModels: Array<any> = [
    {name: 'ship', file: this.mDir + 'ship5.json'},
    {name: 'glas', file: this.mDir + 'ship5_glas.json'},
    {name: 'ship_complete', file: this.mDir + 'ship_complete.json'},
    {name: 'mothership', file: this.mDir + 'mothership.json'},
    {name: 'mothership_ring1', file: this.mDir + 'mothership_ring1.json'},
    {name: 'mothership_ring2', file: this.mDir + 'mothership_ring2.json'},
    {name: 'mothership_sphere', file: this.mDir + 'mothership_sphere.json'},
    {name: 'projection', file: this.mDir + 'projection.json'},
    {name: 'asteroid1', file: this.mDir + 'asteroid1.json'},
    {name: 'asteroid2', file: this.mDir + 'asteroid2.json'},
    {name: 'asteroid3', file: this.mDir + 'asteroid3.json'},
    {name: 'planet_ring', file: this.mDir + 'planet_ring.json'}
  ];
  private modelLoading: any;
  private models: IDictionary = {};

  private cDir: String = 'assets/textures/';
  private loadCubemaps: Array<any> = [
    {
      name: 'ship',
      files: [
        this.cDir + 'cubemap_ship/east.jpg',
        this.cDir + 'cubemap_ship/west.jpg',
        this.cDir + 'cubemap_ship/up.jpg',
        this.cDir + 'cubemap_ship/down.jpg',
        this.cDir + 'cubemap_ship/north.jpg',
        this.cDir + 'cubemap_ship/south.jpg'
      ]
    }
  ];
  private cubemapLoading: any;
  private cubemaps: IDictionary = {};

  private preload() {
    const ref: AssetService = this;
    if (this.loadTextures.length) {
      this.textureLoading = this.loadTextures.pop();
      this.textureLoader.load( this.textureLoading.file, function( texture: THREE.Texture ) {
        ref.textures[ref.textureLoading.name] = texture;
        ref.preload();
      });
    } else if (this.loadModels.length) {
      this.modelLoading = this.loadModels.pop();
      this.jsonLoader.load( this.modelLoading.file, function( geo: THREE.Geometry ) {
        ref.models[ref.modelLoading.name] = geo;
        ref.preload();
      });
    } else if (this.loadCubemaps.length) {
      this.cubemapLoading = this.loadCubemaps.pop();
      this.cubemapLoader.load( this.cubemapLoading.files, function(texture: THREE.CubeTexture){
        ref.cubemaps[ref.cubemapLoading.name] = texture;
        ref.preload();
      });
    } else {
      this.isPreloaded = true;
      this.preloadDone$.emit();
    }
  }

  start() {
    this.preload();
  }

  getTexture(t: string) {
    return this.textures[t];
  }

  getModel(m: string) {
    return this.models[m];
  }

  getCubemap(t: string) {
    return this.cubemaps[t];
  }

}
