import { TestBed, inject } from '@angular/core/testing';
import { SkyboxService } from './skybox.service';

describe('SkyboxService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SkyboxService]
    });
  });

  it('should ...', inject([SkyboxService], (service: SkyboxService) => {
    expect(service).toBeTruthy();
  }));
});
