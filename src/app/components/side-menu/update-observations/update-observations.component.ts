import { Component, OnInit, ChangeDetectorRef, OnDestroy, NgZone } from '@angular/core';
import { UserSettingService } from '../../../core/services/user-setting/user-setting.service';
import { ObservationService } from '../../../core/services/observation/observation.service';
import { Observable, Subscription } from 'rxjs';
import { settings } from '../../../../settings';
import { DataLoadService } from '../../../modules/data-load/services/data-load.service';
import { switchMap, map, distinctUntilChanged, tap } from 'rxjs/operators';
import { DataMarshallService } from '../../../core/services/data-marshall/data-marshall.service';

@Component({
  selector: 'app-update-observations',
  templateUrl: './update-observations.component.html',
  styleUrls: ['./update-observations.component.scss']
})
export class UpdateObservationsComponent implements OnInit, OnDestroy {


  showObservations: boolean;
  lastUpdated: Date;
  settings = settings;
  isLoading: boolean;
  subscriptions: Subscription[] = [];

  constructor(
    private userSettingService: UserSettingService,
    private observationService: ObservationService,
    private dataMarshallService: DataMarshallService,
    private ngZone: NgZone,
    private dataLoadService: DataLoadService) { }

  ngOnInit() {
    this.subscriptions.push(this.userSettingService.showObservations$.subscribe((val) => {
      this.ngZone.run(() => {
        this.showObservations = val;
      });
    }));
    this.subscriptions.push(this.observationService.getLastUpdatedForCurrentGeoHazardAsObservable()
      .subscribe((val) => {
        this.ngZone.run(() => {
          this.lastUpdated = val;
        });
      }));
    this.subscriptions.push(this.observationService.dataLoad$.pipe(
      switchMap((id) => this.dataLoadService.getStateAsObservable(id)),
      map((state) => state.isLoading),
      distinctUntilChanged()).subscribe((val) => {
        this.ngZone.run(() => {
          this.isLoading = val;
        });
      }));
  }

  updateObservations() {
    this.observationService.forceUpdateObservationsForCurrentGeoHazard(
      this.dataMarshallService.cancelObservationsPromise
    );
  }

  ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  cancel() {
    this.dataMarshallService.cancelUpdateObservations();
  }

}