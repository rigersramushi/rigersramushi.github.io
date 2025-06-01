import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploaderComponent } from './uploader';

describe('Uploader', () => {
  let component: UploaderComponent;
  let fixture: ComponentFixture<UploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
