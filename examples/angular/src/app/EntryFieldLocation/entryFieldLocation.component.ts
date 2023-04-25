import { Component, Input } from '@angular/core';
import { FieldAppSDK } from '@contentful/app-sdk';

@Component({
  templateUrl: './entryFieldLocation.component.html',
})
export class EntryFieldLocation {
  @Input() sdk!: FieldAppSDK;
}
