import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiledetailComponent } from './filedetail.component';

describe('FiledetailComponent', () => {
  let component: FiledetailComponent;
  let fixture: ComponentFixture<FiledetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiledetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FiledetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
