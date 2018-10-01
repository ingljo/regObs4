import { Injectable } from '@angular/core';
import { UserSetting } from '../../models/user-settings.model';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { GeoHazard } from '../../models/geo-hazard.enum';
import { AppMode } from '../../models/app-mode.enum';
import { settings } from '../../../../settings';
import { SupportTile } from '../../models/support-tile.model';
import { Events } from '@ionic/angular';
import { NanoSql } from '../../../../nanosql';
import { nSQL } from 'nano-sql';
import { Observable } from 'rxjs';
import { startWith, flatMap, scan, defaultIfEmpty, last, map, take, tap } from 'rxjs/operators';

const STORAGE_KEY_NAME = 'UserSettings';

@Injectable({
  providedIn: 'root'
})
export class UserSettingService {

  constructor(private storage: Storage, private translate: TranslateService, private events: Events) {
  }

  private getDefaultSettings(): UserSetting {
    return {
      appMode: AppMode.Prod,
      language: 'no',
      currentGeoHazard: GeoHazard.Snow,
      observationDaysBack: [
        { geoHazard: GeoHazard.Snow, daysBack: 2 },
        { geoHazard: GeoHazard.Ice, daysBack: 7 },
        { geoHazard: GeoHazard.Dirt, daysBack: 3 },
        { geoHazard: GeoHazard.Water, daysBack: 3 },
      ],
      completedStartWizard: false,
      supportTiles: settings.map.tiles.supportTiles,
      showMapCenter: false,
    };
  }

  getUserSettings(): Promise<UserSetting> {
    return this.getUserSettingsAsObservable().pipe(take(1)).toPromise();
  }

  getUserSettingsAsObservable(): Observable<UserSetting> {
    return nSQL().observable<UserSetting>(() => {
      return nSQL(NanoSql.TABLES.USER_SETTINGS.name).query('select').emit();
    }).toRxJS().pipe(
      map((val: UserSetting[]) => val.length > 0 ? val[0] : this.getDefaultSettings())
    );
  }

  async saveUserSettings(userSetting: UserSetting) {
    // await this.storage.ready();
    // const newSettings = await this.storage.set(STORAGE_KEY_NAME, userSetting);
    await nSQL(NanoSql.TABLES.USER_SETTINGS.name).query('upsert', { id: 'usersettings', ...userSetting }).exec();

    // TODO: Subscribe to observable instead
    this.translate.use(userSetting.language);
    this.events.publish(settings.events.userSettingsChanged, userSetting);
  }

  reset() {
    return this.storage.remove(STORAGE_KEY_NAME);
  }
}
