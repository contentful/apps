import { Component, ViewChild } from '@angular/core';
import { init, locations } from '@contentful/app-sdk';
import { ConfigComponent } from './AppConfigComponent/appConfig.component';
import { DynamicComponentDirective } from './directives/dynamic-component.directive';
import { DynamicComponent } from './dynamic-component';
import { Type } from '@angular/core';

export interface AppInstallationParameters {}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  @ViewChild(DynamicComponentDirective, { static: true })
  dynamicComponent!: DynamicComponentDirective;

  ngOnInit() {
    this.getSdk();
  }

  loadComponent(component: Type<any>, sdk: any) {
    const viewContainerRef = this.dynamicComponent.viewContainerRef;
    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent<DynamicComponent>(component);
    componentRef.instance.sdk = sdk;
  }

  getSdk() {
    init((sdk) => {
      // define locations here
      const locationsMap = {
        [locations.LOCATION_APP_CONFIG]: ConfigComponent,
      };

      // Select a component depending on a location in which the app is rendered.
      Object.entries(locationsMap).forEach(([locationKey, Component]) => {
        if (sdk.location.is(locationKey)) {
          this.loadComponent(Component, sdk);
        }
      });
    });
  }
}
