import { Component, Input } from '@angular/core';
import { ConfigAppSDK, FieldAppSDK, KnownAppSDK, init, locations } from '@contentful/app-sdk';

export interface AppInstallationParameters {}

@Component({
  templateUrl: './appConfig.component.html',
})
export class ConfigComponent {
  @Input() sdk!: ConfigAppSDK;

  parameters = {};

  async onConfigure() {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await this.sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters: this.parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }

  async ngOnInit() {
    const params: AppInstallationParameters | null = await this.sdk.app.getParameters();
    this.parameters = params || this.parameters;
    await this.sdk.app.setReady();
    this.sdk.app.onConfigure(() => this.onConfigure());
  }
}
