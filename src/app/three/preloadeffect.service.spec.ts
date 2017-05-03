import { TestBed, inject } from '@angular/core/testing';
import { PreloadeffectService } from './preloadeffect.service';

describe('PreloadeffectService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PreloadeffectService]
    });
  });

  it('should ...', inject([PreloadeffectService], (service: PreloadeffectService) => {
    expect(service).toBeTruthy();
  }));
});
