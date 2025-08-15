import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageInfoComponent } from './storage-info.component';

describe('StorageInfoComponent', () => {
  let component: StorageInfoComponent;
  let fixture: ComponentFixture<StorageInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageInfoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StorageInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
