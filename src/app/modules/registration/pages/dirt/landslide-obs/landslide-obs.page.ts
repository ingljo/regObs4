import { Component } from '@angular/core';
import { BasePage } from '../../base.page';
import { RegistrationTid } from '../../../models/registrationTid.enum';
import { ModalController } from '@ionic/angular';
import { SetAvalanchePositionPage } from '../../set-avalanche-position/set-avalanche-position.page';
import * as L from 'leaflet';
import { BasePageService } from '../../base-page-service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-landslide-obs',
  templateUrl: './landslide-obs.page.html',
  styleUrls: ['./landslide-obs.page.scss'],
})
export class LandslideObsPage extends BasePage {

  constructor(
    basePageService: BasePageService,
    activatedRoute: ActivatedRoute,
    private modalController: ModalController,
  ) {
    super(RegistrationTid.LandSlideObs, basePageService, activatedRoute);
  }

  onInit() {
    if (!this.registration.LandSlideObs.Urls) {
      this.registration.LandSlideObs.Urls = [];
    }
  }

  isValid() {
    return this.registration
      && this.registration.LandSlideObs
      && !!this.registration.LandSlideObs.DtLandSlideTime
      && !!this.registration.LandSlideObs.DtLandSlideTimeEnd;
  }

  async setLandslidePosition() {
    const relativeToLatLng = this.registration.ObsLocation
      ? L.latLng(this.registration.ObsLocation.Latitude, this.registration.ObsLocation.Longitude) : null;
    const startLatLng = this.registration.LandSlideObs.StartLat && this.registration.LandSlideObs.StartLong ?
      L.latLng(this.registration.LandSlideObs.StartLat, this.registration.LandSlideObs.StartLong) : null;
    const endLatLng = this.registration.LandSlideObs.StopLat && this.registration.LandSlideObs.StopLong ?
      L.latLng(this.registration.LandSlideObs.StopLat, this.registration.LandSlideObs.StopLong) : null;
    const modal = await this.modalController.create({
      component: SetAvalanchePositionPage,
      componentProps: { relativeToLatLng, startLatLng, endLatLng },
    });
    modal.present();
    const result = await modal.onDidDismiss();
    if (result.data) {
      const start: L.LatLng = result.data.start;
      const end: L.LatLng = result.data.end;
      this.registration.LandSlideObs.StartLat = start.lat;
      this.registration.LandSlideObs.StartLong = start.lng;
      this.registration.LandSlideObs.StopLat = end.lat;
      this.registration.LandSlideObs.StopLong = end.lng;
    }
  }

}