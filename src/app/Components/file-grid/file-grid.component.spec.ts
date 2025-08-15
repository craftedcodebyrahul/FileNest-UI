import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileGridComponent } from './file-grid.component';

describe('FileGridComponent', () => {
  let component: FileGridComponent;
  let fixture: ComponentFixture<FileGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileGridComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
