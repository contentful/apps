import { Component, Input } from '@angular/core';
import { EditorAppSDK } from '@contentful/app-sdk';

@Component({
  templateUrl: './entryLocation.component.html',
})
export class EntryLocation {
  @Input() sdk!: EditorAppSDK;
}
