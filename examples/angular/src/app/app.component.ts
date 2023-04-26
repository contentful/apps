import { Component, ViewChild } from '@angular/core';
import { init, locations } from '@contentful/app-sdk';
import { DynamicComponentDirective } from './directives/dynamic-component.directive';
import { DynamicComponent } from './dynamic-component';
import { AppConfigLocation } from './AppConfigLocation/appConfigLocation.component';
import { EntryFieldLocation } from './EntryFieldLocation/entryFieldLocation.component';
import { Type } from '@angular/core';
import { SidebarLocation } from './SidebarLocation/sidebarLocation.component';
import { DialogLocation } from './DialogLocation/dialogLocation.component';
import { EntryLocation } from './EntryLocation/entryLocation.component';
import { PageLocation } from './PageLocation/pageLocation.component';
import { HomeLocation } from './HomeLocation/homeLocation.component';
import { LocalHostWarning } from './LocalHostWarning/localHostWarning.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  @ViewChild(DynamicComponentDirective, { static: true })
  dynamicComponent!: DynamicComponentDirective;

  ngOnInit() {
    if (process.env?.['NODE_ENV'] === 'development' && window.self === window.top) {
      this.loadComponent(LocalHostWarning);
    } else {
      this.getSdk();
    }
  }

  loadComponent(component: Type<any>, sdk?: any) {
    const viewContainerRef = this.dynamicComponent.viewContainerRef;
    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent<DynamicComponent>(component);
    componentRef.instance.sdk = sdk;
  }

  getSdk() {
    init((sdk) => {
      // define locations here
      const locationsMap = {
        [locations.LOCATION_APP_CONFIG]: AppConfigLocation,
        [locations.LOCATION_ENTRY_FIELD]: EntryFieldLocation,
        [locations.LOCATION_ENTRY_SIDEBAR]: SidebarLocation,
        [locations.LOCATION_DIALOG]: DialogLocation,
        [locations.LOCATION_ENTRY_EDITOR]: EntryLocation,
        [locations.LOCATION_PAGE]: PageLocation,
        [locations.LOCATION_HOME]: HomeLocation,
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
