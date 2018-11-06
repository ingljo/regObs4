import { Component, OnInit, Input, NgZone, ChangeDetectorRef, ViewChild } from '@angular/core';
import { ModalController, Thumbnail } from '@ionic/angular';
import { ObsLocationDto } from '../../../regobs-api/models';
import * as L from 'leaflet';
import { TranslateService } from '@ngx-translate/core';
import { SetLocationInMapComponent } from '../../components/set-location-in-map/set-location-in-map.component';

@Component({
  selector: 'app-set-avalanche-position',
  templateUrl: './set-avalanche-position.page.html',
  styleUrls: ['./set-avalanche-position.page.scss'],
})
export class SetAvalanchePositionPage implements OnInit {
  @Input() startLatLng?: L.LatLng;
  @Input() endLatLng?: L.LatLng;
  @Input() relativeToLatLng?: L.LatLng;

  start: L.LatLng;
  end: L.LatLng;
  private map: L.Map;
  private pathLine: L.Polyline;

  fromMarker: L.Marker;
  locationMarker: L.Marker;
  confirmLocationText = '';
  locationText = '';
  startImageUrl = '/assets/icon/map/GPS_start.svg';
  private startIcon = L.icon({
    iconUrl: this.startImageUrl,
    iconSize: [27, 42],
    iconAnchor: [13.5, 41]
  });
  endImageUrl = '/assets/icon/map/GPS_stop.svg';
  private endIcon = L.icon({
    iconUrl: this.endImageUrl,
    iconSize: [27, 42],
    iconAnchor: [13.5, 41]
  });
  private translations;

  @ViewChild(SetLocationInMapComponent) setLocationInMapComponent: SetLocationInMapComponent;

  constructor(
    private cdr: ChangeDetectorRef,
    private translateService: TranslateService,
    private ngZone: NgZone,
    private modalController: ModalController) { }

  async ngOnInit() {
    this.translations = await this.translateService.get([
      'REGISTRATION.DIRT.LAND_SLIDE_OBS.START_POSITION',
      'REGISTRATION.DIRT.LAND_SLIDE_OBS.END_POSITION',
      'DIALOGS.CONFIRM'
    ]).toPromise();
    const fallbackLatlng = L.latLng(59.1, 10.3);
    if (this.startLatLng) {
      this.start = L.latLng(this.startLatLng.lat, this.startLatLng.lng);
    }
    if (this.endLatLng) {
      this.end = L.latLng(this.endLatLng.lat, this.endLatLng.lng);
    }
    this.locationMarker = L.marker(this.relativeToLatLng || fallbackLatlng, {
      icon: this.startIcon
    });
    if (this.relativeToLatLng) {
      this.fromMarker = L.marker(this.relativeToLatLng); // TODO: Icon
    }
  }

  onMapReady(map: L.Map) {
    this.map = map;
    this.updateMarkers();
  }

  private updateMarkers() {
    if (!this.start) {
      this.locationMarker.setIcon(this.startIcon);
      this.confirmLocationText =
        `${this.translations['DIALOGS.CONFIRM']} ${this.translations['REGISTRATION.DIRT.LAND_SLIDE_OBS.START_POSITION'].toLowerCase()}`;
      this.locationText = this.translations['REGISTRATION.DIRT.LAND_SLIDE_OBS.START_POSITION'];
    } else {
      L.marker(this.start, { icon: this.startIcon }).addTo(this.map);

      this.locationMarker.setIcon(this.endIcon);
      if (this.end) {
        this.locationMarker.setLatLng(this.end);
      }
      this.confirmLocationText =
        `${this.translations['DIALOGS.CONFIRM']} ${this.translations['REGISTRATION.DIRT.LAND_SLIDE_OBS.END_POSITION'].toLowerCase()}`;
      this.locationText = this.translations['REGISTRATION.DIRT.LAND_SLIDE_OBS.END_POSITION'];

      this.ngZone.runOutsideAngular(() => {
        this.map.on('drag', () => this.updatePolyline());
        this.updatePolyline();
      });
    }
    this.cdr.detectChanges();
  }

  updatePolyline() {
    if (this.start && this.locationMarker) {
      const path = [this.locationMarker.getLatLng(), this.start];
      if (!this.pathLine) {
        this.pathLine = L.polyline(path, { color: 'red', weight: 6, opacity: .9 }).addTo(this.map);
      } else {
        this.pathLine.setLatLngs(path);
      }
    }
  }

  async onLocationSet(event: ObsLocationDto) {
    if (!this.start) {
      this.start = L.latLng(event.Latitude, event.Longitude);
      this.updateMarkers();
    } else {
      this.end = L.latLng(event.Latitude, event.Longitude);
      this.modalController.dismiss({ start: this.start, end: this.end });
    }
  }

  cancel() {
    this.modalController.dismiss();
  }

  ok() {
    this.setLocationInMapComponent.confirmLocation();
  }
}