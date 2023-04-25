import { Component, Input } from '@angular/core';
import { DialogAppSDK } from '@contentful/app-sdk';

@Component({
  templateUrl: './dialogLocation.component.html',
})
export class DialogLocation {
  @Input() sdk!: DialogAppSDK;
}
