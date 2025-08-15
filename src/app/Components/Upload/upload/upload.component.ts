import { Component, ElementRef, ViewChild } from '@angular/core';
import { APP_MODULES } from '../../../app.module';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [APP_MODULES],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent {
 @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('progressArea') progressArea!: ElementRef<HTMLElement>;
  @ViewChild('uploadedArea') uploadedArea!: ElementRef<HTMLElement>;

  triggerFileInput(event: Event) {
    event.preventDefault();
    this.fileInput.nativeElement.click();
  }

  onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      let fileName = file.name;
      if (fileName.length >= 12) {
        const splitName = fileName.split('.');
        fileName = splitName[0].substring(0, 13) + "... ." + splitName[1];
      }
      this.uploadFile(file, fileName);
    }
  }

  uploadFile(file: File, name: string) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'php/upload.php'); // replace with real endpoint

    xhr.upload.addEventListener('progress', ({ loaded, total }) => {
      const fileLoaded = Math.floor((loaded / total) * 100);
      const fileTotal = Math.floor(total / 1000);
      const fileSize =
        fileTotal < 1024
          ? fileTotal + ' KB'
          : (loaded / (1024 * 1024)).toFixed(2) + ' MB';

      const progressHTML = `
        <li class="row">
          <i class="fas fa-file-alt"></i>
          <div class="content">
            <div class="details">
              <span class="name">${name} • Uploading</span>
              <span class="percent">${fileLoaded}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress" style="width: ${fileLoaded}%"></div>
            </div>
          </div>
        </li>`;

      this.uploadedArea.nativeElement.classList.add('onprogress');
      this.progressArea.nativeElement.innerHTML = progressHTML;

      if (loaded === total) {
        this.progressArea.nativeElement.innerHTML = '';
        const uploadedHTML = `
          <li class="row">
            <div class="content upload">
              <i class="fas fa-file-alt"></i>
              <div class="details">
                <span class="name">${name} • Uploaded</span>
                <span class="size">${fileSize}</span>
              </div>
            </div>
            <i class="fas fa-check"></i>
          </li>`;
        this.uploadedArea.nativeElement.classList.remove('onprogress');
        this.uploadedArea.nativeElement.insertAdjacentHTML('afterbegin', uploadedHTML);
      }
    });

    const formData = new FormData();
    formData.append('file', file);

    xhr.send(formData);
  }
}
