import { Component, Input } from '@angular/core';
import { HomeAppSDK } from '@contentful/app-sdk';

@Component({
  templateUrl: './homeLocation.component.html',
})
export class HomeLocation {
  @Input() sdk!: HomeAppSDK;
}
