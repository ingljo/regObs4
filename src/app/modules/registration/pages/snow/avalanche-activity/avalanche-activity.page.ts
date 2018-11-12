import { Component, OnInit, NgZone } from '@angular/core';
import { RegistrationTid } from '../../../models/registrationTid.enum';
import { ActivatedRoute } from '@angular/router';
import { BasePage } from '../../base.page';
import { BasePageService } from '../../base-page-service';
import { ModalController } from '@ionic/angular';
import { AvalancheActivityModalPage } from './avalanche-activity-modal/avalanche-activity-modal.page';
import { AvalancheActivityObs2Dto, KdvElement } from '../../../../regobs-api/models';
import { KdvService } from '../../../../../core/services/kdv/kdv.service';
import { UserSettingService } from '../../../../../core/services/user-setting/user-setting.service';

@Component({
  selector: 'app-avalanche-activity',
  templateUrl: './avalanche-activity.page.html',
  styleUrls: ['./avalanche-activity.page.scss'],
})
export class AvalancheActivityPage extends BasePage {
  private avalancheCause: KdvElement[];
  private estimatedNumber: KdvElement[];

  constructor(
    basePageService: BasePageService,
    activatedRoute: ActivatedRoute,
    private modalController: ModalController,
    private ngZone: NgZone,
    private kdvService: KdvService,
    private userSetttingService: UserSettingService,
  ) {
    super(RegistrationTid.AvalancheActivityObs2, basePageService, activatedRoute);
    this.avalancheCause = [];
    this.estimatedNumber = [];
  }

  async onInit() {
    const userSetting = await this.userSetttingService.getUserSettings();
    this.avalancheCause = await this.kdvService.getKdvRepositories(userSetting.language, userSetting.appMode, 'Snow_AvalancheExtKDV');
    this.estimatedNumber = await this.kdvService.getKdvRepositories(userSetting.language, userSetting.appMode, 'Snow_EstimatedNumKDV');
  }

  async addOrEditAvalancheActivity(index?: number) {
    const modal = await this.modalController.create({
      component: AvalancheActivityModalPage,
      componentProps: { avalancheActivity: this.registration.request.AvalancheActivityObs2[index] },
    });
    modal.present();
    const result = await modal.onDidDismiss();
    this.ngZone.run(() => {
      if (result.data) {
        if (result.data.delete) {
          this.registration.request.AvalancheActivityObs2.splice(index, 1);
        } else {
          const avalancheActivityObs: AvalancheActivityObs2Dto = result.data;
          if (index !== undefined) {
            this.registration.request.AvalancheActivityObs2[index] = avalancheActivityObs;
          } else {
            this.registration.request.AvalancheActivityObs2.push(avalancheActivityObs);
          }
        }
      }
    });
  }

  getCause(avalancheActivityObs: AvalancheActivityObs2Dto) {
    const cause = this.avalancheCause.find((c) => c.Id === avalancheActivityObs.AvalancheExtTID);
    if (cause) {
      return cause.Name;
    } else {
      return 'REGISTRATION.SNOW.AVALANCHE_PROBLEM.UNKNOWN_TYPE';
    }
  }

  getEstimatedNumber(avalancheActivityObs: AvalancheActivityObs2Dto) {
    const kdvalue = this.estimatedNumber.find((c) => c.Id === avalancheActivityObs.EstimatedNumTID);
    if (kdvalue) {
      return kdvalue.Name;
    } else {
      return 'REGISTRATION.SNOW.AVALANCHE_ACTIVITY.UNKNOWN_NUMBER';
    }
  }
}
