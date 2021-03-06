import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Injectable({
  providedIn: 'root'
})
export class ExternalLinkService {

  constructor(private inAppBrowser: InAppBrowser) { }

  openExternalLink(url: string) {
    // const iap = this.inAppBrowser.create(url, '_system');
    // iap.show();
    // NOTE: The above code crashes Android. Workaround is to use cordova plugin direct.
    const w = (<any>window);
    if (w.cordova && w.cordova.InAppBrowser) {
      w.cordova.InAppBrowser.open(url, '_system', 'location=yes');
    } else {
      window.open(url, '_blank');
    }
  }
}
