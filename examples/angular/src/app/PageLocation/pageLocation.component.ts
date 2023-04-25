import { Component, Input } from '@angular/core';
import { PageAppSDK } from '@contentful/app-sdk';

@Component({
  templateUrl: './pageLocation.component.html',
})
export class PageLocation {
  @Input() sdk!: PageAppSDK;
}
