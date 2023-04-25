import { Input, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DynamicComponentDirective } from './directives/dynamic-component.directive';
import { ConfigAppSDK, FieldAppSDK, KnownAppSDK, init, locations } from '@contentful/app-sdk';

@NgModule({
  declarations: [AppComponent, DynamicComponentDirective],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
