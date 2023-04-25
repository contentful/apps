import { Component, Input } from '@angular/core';
import { SidebarAppSDK } from '@contentful/app-sdk';

@Component({
  templateUrl: './sidebarLocation.component.html',
})
export class SidebarLocation {
  @Input() sdk!: SidebarAppSDK;
}
