import { Component, NgZone } from '@angular/core';
import { BasePage } from '../../base.page';
import { RegistrationTid } from '../../../models/registrationTid.enum';
import { KdvService } from '../../../../../core/services/kdv/kdv.service';
import { UserSettingService } from '../../../../../core/services/user-setting/user-setting.service';
import { GeoHazard } from '../../../../../core/models/geo-hazard.enum';
import { KdvElement } from '../../../../regobs-api/models';
import { BasePageService } from '../../base-page-service';
import { ActivatedRoute } from '@angular/router';

const NO_DAMAGE_VISIBLE = 7;

@Component({
  selector: 'app-damage',
  templateUrl: './damage.page.html',
  styleUrls: ['./damage.page.scss'],
})
export class DamagePage extends BasePage {
  damageTypes: KdvElement[];
  checked: boolean;

  get isChecked() {
    if (!this.registration
      || !this.registration.request
      || !this.registration.request.DamageObs
      || this.registration.request.DamageObs.length === 0) {
      return this.checked;
    }
    return this.registration && this.registration.request.DamageObs.filter((x) => x.DamageTypeTID !== NO_DAMAGE_VISIBLE).length > 0;
  }

  set isChecked(val: boolean) {
    this.checked = val;
    if (val === false) {
      this.registration.request.DamageObs = [
        {
          DamageTypeTID: NO_DAMAGE_VISIBLE
        }
      ];
    } else {
      this.registration.request.DamageObs = this.registration.request.DamageObs.filter((x) => x.DamageTypeTID !== NO_DAMAGE_VISIBLE);
    }
  }

  constructor(
    basePageService: BasePageService,
    activatedRoute: ActivatedRoute,
    private kdvService: KdvService,
    private userSettingService: UserSettingService,
    private ngZone: NgZone,
  ) {
    super(RegistrationTid.DamageObs, basePageService, activatedRoute);
  }

  async onInit() {
    const userSetting = await this.userSettingService.getUserSettings();
    const geoHazardName = GeoHazard[this.registration.geoHazard];
    const kdvElements = (await this.kdvService.getKdvRepositories(userSetting.language, userSetting.appMode,
      `${geoHazardName}_DamageTypeKDV`))
      .filter((x) => x.Id !== NO_DAMAGE_VISIBLE);
    this.ngZone.run(() => {
      this.damageTypes = kdvElements;
    });
  }
}
