import { Injectable } from '@angular/core';
import * as RegobsApi from '../../../modules/regobs-api/services';
import { settings } from '../../../../settings';
import { UserSettingService } from '../user-setting/user-setting.service';
import { LangKey } from '../../models/langKey';
import { AppMode } from '../../models/app-mode.enum';
import { NanoSql } from '../../../../nanosql';
import { KdvElementsResponseDto } from '../../../modules/regobs-api/models';
import { from, combineLatest } from 'rxjs';
import { UserSetting } from '../../models/user-settings.model';
import { switchMap } from 'rxjs/operators';
import { DataLoadService } from '../../../modules/data-load/services/data-load.service';
import * as moment from 'moment';
import { ObservableHelper } from '../../helpers/observable-helper';
import { LoggingService } from '../../../modules/shared/services/logging/logging.service';

const DEBUG_TAG = 'KdvService';

@Injectable({
  providedIn: 'root'
})
export class KdvService {

  constructor(
    private kdvApiService: RegobsApi.KdvElementsService,
    private userSettingService: UserSettingService,
    private dataLoadService: DataLoadService,
    private loggingService: LoggingService,
  ) { }

  async updateKdvElements(cancel?: Promise<void>) {
    const userSetting = await this.userSettingService.getUserSettings();
    await this.checkLastUpdatedAndUpdateDataIfNeeded(userSetting.appMode, userSetting.language, cancel);
  }

  private getDataLoadId(appMode: AppMode, language: LangKey) {
    return `${NanoSql.TABLES.KDV_ELEMENTS.name}_${appMode}_${language}`;
  }

  private async checkLastUpdatedAndUpdateDataIfNeeded(appMode: AppMode, language: LangKey, cancel?: Promise<void>) {
    const dataLoad = await this.dataLoadService.getState(this.getDataLoadId(appMode, language));
    const isLoadingTimeout = moment().subtract(settings.foregroundUpdateIntervalMs, 'milliseconds');
    if (dataLoad.isLoading && moment(dataLoad.startedDate).isAfter(isLoadingTimeout)) {
      this.loggingService.debug(`Kdv elements is allready being updated.`, DEBUG_TAG);
    } else {
      const lastUpdateLimit = moment().subtract(settings.kdvElements.daysBeforeUpdate, 'day');
      if (!dataLoad.lastUpdated || moment(dataLoad.lastUpdated).isBefore(lastUpdateLimit)) {
        await this.updateKdvElementsForLanguage(appMode, language, cancel);
      }
    }
  }

  async updateKdvElementsForLanguage(appMode: AppMode, language: LangKey, cancel?: Promise<void>) {
    const dataLoadId = this.getDataLoadId(appMode, language);
    await this.dataLoadService.startLoading(dataLoadId);
    try {
      this.kdvApiService.rootUrl = settings.services.regObs.apiUrl[appMode];
      const kdvElements = await ObservableHelper.toPromiseWithCancel(
        this.kdvApiService.KdvElementsGetKdvs({ langkey: language }), cancel);
      await NanoSql.getInstance(NanoSql.TABLES.KDV_ELEMENTS.name, appMode)
        .query('upsert', { langKey: language, ...kdvElements }).exec();
      await this.dataLoadService.loadingCompleted(dataLoadId);
      return true;
    } catch (err) {
      await this.dataLoadService.loadingError(dataLoadId, err.message);
      return false;
    }
  }

  async getKdvRepositories(langKey: LangKey, appMode: AppMode, key: string) {
    const kdvElemetns = await this.getKdvElements(langKey, appMode);
    return kdvElemetns.KdvRepositories[key];
  }

  async getViewRepositories(langKey: LangKey, appMode: AppMode, key: string) {
    const kdvElemetns = await this.getKdvElements(langKey, appMode);
    return kdvElemetns.ViewRepositories[key];
  }

  async getKdvElements(langKey: LangKey, appMode: AppMode) {
    const resultFromDb = await this.getKdvElementsFromDb(langKey, appMode);
    if (resultFromDb) {
      return resultFromDb;
    } else {
      const langKeyName = LangKey[langKey];
      const defaultKdvElements: KdvElementsResponseDto = require(`../../../../assets/json/kdvelements.${langKeyName}.json`);
      return defaultKdvElements;
    }
  }

  getKdvElementsAsObservable(key: string, userSetting?: UserSetting) {
    if (userSetting) {
      return from(this.getKdvRepositories(userSetting.language, userSetting.appMode, key));
    } else {
      return combineLatest(this.userSettingService.appMode$, this.userSettingService.language$).pipe(
        switchMap(([appMode, language]) => from(this.getKdvRepositories(language, appMode, key))));
    }
  }

  private async getKdvElementsFromDb(langKey: LangKey, appMode: AppMode): Promise<KdvElementsResponseDto> {
    const result = await NanoSql.getInstance(NanoSql.TABLES.KDV_ELEMENTS.name, appMode).query('select')
      .where(['langKey', '=', langKey]).exec();
    if (result.length > 0) {
      return result[0] as KdvElementsResponseDto;
    } else {
      return null;
    }
  }
}
