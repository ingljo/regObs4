import { Injectable } from '@angular/core';
import { UserSetting } from '../../models/user-settings.model';
import { TranslateService } from '@ngx-translate/core';
import { GeoHazard } from '../../models/geo-hazard.enum';
import { AppMode } from '../../models/app-mode.enum';
import { settings } from '../../../../settings';
import { NanoSql } from '../../../../nanosql';
import { Observable, combineLatest } from 'rxjs';
import { map, take, shareReplay, distinctUntilChanged, distinct, tap } from 'rxjs/operators';
import { LangKey } from '../../models/langKey';
import { TopoMap } from '../../models/topo-map.enum';
import { LoggingService } from '../../../modules/shared/services/logging/logging.service';
import '../../helpers/nano-sql/nanoObserverToRxjs';
import { nSQL } from '@nano-sql/core';
import { NanoSqlObservableHelper } from '../../helpers/nano-sql/nanoObserverToRxjs';

const DEBUG_TAG = 'UserSettingService';

@Injectable({
  providedIn: 'root'
})
export class UserSettingService {

  // Setting this observable to be a shared instance since
  // UserSettingService is a singleton service.
  // The observable will be shared with many services
  private _userSettingObservable: Observable<UserSetting>;
  private _currentGeoHazardObservable: Observable<GeoHazard[]>;
  private _appModeObservable: Observable<AppMode>;
  private _showMapCenter: Observable<boolean>;
  private _appModeAndLanguageObservable: Observable<[AppMode, LangKey]>;
  private _appModeLanguageAndCurrentGeoHazardObservable: Observable<[AppMode, LangKey, GeoHazard[]]>;
  private _languageObservable: Observable<LangKey>;
  private _daysBackObservable: Observable<{ geoHazard: GeoHazard, daysBack: number }[]>;
  private _showObservationsObservable: Observable<boolean>;

  get userSettingObservable$() {
    return this._userSettingObservable;
  }

  get currentGeoHazardObservable$() {
    return this._currentGeoHazardObservable;
  }

  get appMode$() {
    return this._appModeObservable;
  }

  get appModeAndLanguage$() {
    return this._appModeAndLanguageObservable;
  }

  get appModeLanguageAndCurrentGeoHazard$() {
    return this._appModeLanguageAndCurrentGeoHazardObservable;
  }

  get language$() {
    return this._languageObservable;
  }

  get showMapCenter$() {
    return this._showMapCenter;
  }

  get daysBack$() {
    return this._daysBackObservable;
  }

  get showObservations$() {
    return this._showObservationsObservable;
  }

  constructor(private translate: TranslateService, private loggingService: LoggingService) {
    this._userSettingObservable = this.getUserSettingsAsObservable();
    this._currentGeoHazardObservable = this._userSettingObservable.pipe(
      map((val) => val.currentGeoHazard),
      distinctUntilChanged<GeoHazard[], string>((a, b) => a.localeCompare(b) === 0, (keySelector) => keySelector.join(',')),
      tap((val) => this.loggingService.debug(`Current geohazard changed to: ${val.join(',')}`, DEBUG_TAG)),
      shareReplay(1));

    this.userSettingObservable$.subscribe((userSetting) => {
      this.translate.use(LangKey[userSetting.language]);
    });
    this._appModeObservable = this.userSettingObservable$
      .pipe(
        map((val) => val.appMode),
        distinctUntilChanged(), shareReplay(1));

    this._languageObservable = this.userSettingObservable$
      .pipe(
        map((val) => val.language),
        distinctUntilChanged(), shareReplay(1));

    this._daysBackObservable = this.userSettingObservable$
      .pipe(
        map((val) => val.observationDaysBack),
        distinctUntilChanged<{ geoHazard: GeoHazard, daysBack: number }[], string>(
          (a, b) => a.localeCompare(b) === 0, (keySelector) => JSON.stringify(keySelector)),
        tap((val) => this.loggingService.debug(`Days back changed to:`, DEBUG_TAG, val)),
        shareReplay(1));

    this._appModeAndLanguageObservable = combineLatest(this.appMode$, this.language$)
      .pipe(shareReplay(1));

    this._appModeLanguageAndCurrentGeoHazardObservable = combineLatest(
      this.appMode$, this.language$, this.currentGeoHazardObservable$)
      .pipe(shareReplay(1));

    this._showMapCenter = this.userSettingObservable$
      .pipe(
        map((val) => val.showMapCenter),
        distinctUntilChanged(), shareReplay(1));

    this._showObservationsObservable = this.userSettingObservable$
      .pipe(
        map((val) => val.showObservations),
        distinctUntilChanged(), shareReplay(1));
  }

  private getDefaultSettings(): UserSetting {
    return {
      appMode: AppMode.Prod,
      language: LangKey.no,
      currentGeoHazard: [GeoHazard.Snow],
      observationDaysBack: [
        { geoHazard: GeoHazard.Snow, daysBack: 2 },
        { geoHazard: GeoHazard.Ice, daysBack: 7 },
        { geoHazard: GeoHazard.Dirt, daysBack: 3 },
        { geoHazard: GeoHazard.Water, daysBack: 3 },
      ],
      completedStartWizard: false,
      supportTiles: [],
      showMapCenter: false,
      tilesCacheSize: settings.map.tiles.cacheSize,
      showObservations: true,
      emailReciept: true,
      topoMap: TopoMap.mixArcGisOnline,
      showGeoSelectInfo: true,
    };
  }

  getUserSettings(): Promise<UserSetting> {
    return this.userSettingObservable$.pipe(take(1)).toPromise();
  }

  private getUserSettingsAsObservable(): Observable<UserSetting> {
    return NanoSqlObservableHelper.toRxJS<UserSetting[]>(
      nSQL(NanoSql.TABLES.USER_SETTINGS.name).query('select')
        .listen()).pipe(
          map((val: UserSetting[]) => val.length > 0 ? val[0] : this.getDefaultSettings()),
          shareReplay(1)
        );
  }

  async saveUserSettings(userSetting: UserSetting) {
    await nSQL(NanoSql.TABLES.USER_SETTINGS.name).query('upsert', { id: 'usersettings', ...userSetting }).exec();
  }
}
