import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { SceneComponent } from './scene/scene.component';

import { PreloadeffectService } from './three/preloadeffect.service';
import { UtilsService } from './three/utils.service';
import { AssetService } from './three/asset.service';
import { CameraService } from './three/camera.service';
import { PlanetService } from './three/planet.service';
import { LightService } from './three/light.service';
import { SkyboxService } from './three/skybox.service';
import { ShipService } from './three/ship.service';
import { PanelService } from './three/panel.service';
import { AsteroidService } from './three/asteroid.service';

@NgModule({
  declarations: [
    AppComponent,
    SceneComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [
    PreloadeffectService,
    UtilsService,
    AssetService,
    CameraService,
    PlanetService,
    LightService,
    SkyboxService,
    ShipService,
    PanelService,
    AsteroidService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
