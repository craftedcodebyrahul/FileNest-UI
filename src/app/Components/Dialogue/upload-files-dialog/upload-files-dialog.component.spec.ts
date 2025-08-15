import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadFilesDialogComponent } from './upload-files-dialog.component';

describe('UploadFilesDialogComponent', () => {
  let component: UploadFilesDialogComponent;
  let fixture: ComponentFixture<UploadFilesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadFilesDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UploadFilesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
