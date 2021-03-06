import { Component, OnInit, ViewChild, OnDestroy, NgZone } from '@angular/core';
import { ObservationService } from '../../core/services/observation/observation.service';
import { Subscription, combineLatest, Observable, BehaviorSubject } from 'rxjs';
import { UserSettingService } from '../../core/services/user-setting/user-setting.service';
import { LoginService } from '../../modules/login/services/login.service';
import { IonInfiniteScroll, NavController, IonVirtualScroll } from '@ionic/angular';
import { ObserverResponseDto, RegistrationViewModel } from '../../modules/regobs-api/models';
import { RegistrationService } from '../../modules/registration/services/registration.service';
import * as moment from 'moment';
import { map, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { IRegistration } from '../../modules/registration/models/registration.model';
// import { ObsCardHeightService } from '../../core/services/obs-card-height/obs-card-height.service';

interface MyVirtualScrollItem {
  type: 'draft' | 'sync' | 'sent';
  id: string;
  item: IRegistration | RegistrationViewModel;
}

const LIST_HEADERS = {
  'draft': { header: 'REGISTRATION.DRAFTS', subtitle: 'REGISTRATION.DRAFTS_DESCRIPTION' },
  'sync': { header: 'REGISTRATION.SAVED_ON_PHONE', subtitle: 'REGISTRATION.SAVED_DESCRIPTION' },
  'sent': { header: 'MY_OBSERVATIONS.MY_SENT_OBSERVATIONS' },
};

@Component({
  selector: 'app-my-observations',
  templateUrl: './my-observations.page.html',
  styleUrls: ['./my-observations.page.scss'],
})
export class MyObservationsPage implements OnInit, OnDestroy {
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonVirtualScroll) virtualScroll: IonVirtualScroll;
  private registrationSubscription: Subscription;
  private user: ObserverResponseDto;
  // theBoundCallback: Function;
  loaded = false;
  refreshFunc: Function;
  private firstDataLoad = false;
  virtualItems: MyVirtualScrollItem[] = [];
  myObservations: BehaviorSubject<RegistrationViewModel[]>;

  get showEmptyState() {
    return this.loaded && this.virtualItems.length === 0 && this.firstDataLoad;
  }

  constructor(
    private observationService: ObservationService,
    private ngZone: NgZone,
    private userSettingService: UserSettingService,
    private navContoller: NavController,
    private registrationService: RegistrationService,
    // private obsCardHeightService: ObsCardHeightService,
    private loginService: LoginService) {
    this.refreshFunc = this.refresh.bind(this);
    this.myObservations = new BehaviorSubject([]);
  }

  refresh(cancelPromise: Promise<any>) {
    return this.registrationService.syncRegistrations(cancelPromise).then(() =>
      this.loadData(cancelPromise));
  }

  async ngOnInit() {
    // this.theBoundCallback = this.getItemHeight.bind(this);
    const loggedInUser = await this.loginService.getLoggedInUser();
    if (!loggedInUser.isLoggedIn) {
      this.navContoller.navigateRoot('/');
    } else {
      this.user = loggedInUser.user;
    }

    this.registrationSubscription = this.getVirtualScrollItemsObservable().subscribe((val) => {
      this.updateVirtualItems(val);
    });

    this.loadData();
  }

  private updateVirtualItems(virtualItems: MyVirtualScrollItem[]) {
    if (!this.loaded) {
      this.initVirtualItems(virtualItems);
    } else {
      this.ngZone.run(() => {
        const reloadMyObservations = this.virtualItems.filter((x) => x.type === 'sync').length !==
          virtualItems.filter((x) => x.type === 'sync').length;

        const indexUpdates = this.mergeVirtualItems(virtualItems);
        const indexRange = this.getIndexRange(indexUpdates);
        setTimeout(() => {
          this.checkRange(indexRange.min, indexRange.max);
        });

        if (reloadMyObservations) {
          this.myObservations.next([]);
          this.loadData();
        }
      });
    }
  }

  private getIndexRange(indexesToCheck: number[]) {
    if (indexesToCheck && indexesToCheck.length > 0) {
      return { min: Math.min(...indexesToCheck), max: Math.max(...indexesToCheck) };
    } else {
      return { min: 0, max: 0 };
    }
  }

  private checkRange(index: number, toIndex: number) {
    if (this.virtualScroll) {
      this.virtualScroll.checkRange(index); // checking all items after this index
    }
  }

  // TODO: Implement custom List IterableDiffer
  // https://blog.mgechev.com/2017/11/14/angular-iterablediffer-keyvaluediffer-custom-differ-track-by-fn-performance/

  private mergeVirtualItems(virtualItems: MyVirtualScrollItem[]) {
    const checkIndexes = [];
    for (const existingItem of this.virtualItems) {
      if (!virtualItems.find((x) => x.type === existingItem.type && x.id === existingItem.id)) {
        // Item has been removed
        const index = this.virtualItems.indexOf(existingItem);
        this.virtualItems.splice(index, 1);
        checkIndexes.push(index);
      }
    }

    for (const virtualItem of virtualItems) {
      const findItemIndex = this.findItemIndex(virtualItem);
      if (findItemIndex.changed) {
        this.virtualItems.splice(findItemIndex.index, findItemIndex.replace, virtualItem);
        checkIndexes.push(findItemIndex.index);
      }
    }
    return checkIndexes;
  }

  private findItemIndex(item: MyVirtualScrollItem) {
    const existingIndex = this.virtualItems.findIndex((x) => x.type === item.type && x.id === item.id);
    if (existingIndex >= 0) {
      const changed = this.hasChanged(item, this.virtualItems[existingIndex]);
      return { index: existingIndex, replace: changed ? 1 : 0, changed };
    } else {
      const i = this.virtualItems.findIndex((x) => this.isBefore(item, x));
      if (i >= 0) {
        return { index: i, replace: 0, changed: true };
      } else {
        return { index: this.virtualItems.length, replace: 0, changed: true };
      }
    }
  }

  private hasChanged(item: MyVirtualScrollItem, currentItem: MyVirtualScrollItem) {
    if (item.type === 'sent' && currentItem.type === 'sent') {
      return !(moment((<RegistrationViewModel>item.item).DtChangeTime)
        .isSame(moment((<RegistrationViewModel>currentItem.item).DtChangeTime)));
    }
    return false;
  }

  private isBefore(item: MyVirtualScrollItem, currentItem: MyVirtualScrollItem) {
    if (item.type === 'draft' || item.type === 'sync') {
      return this.isDraftBefore(item, currentItem);
    } else {
      return this.isRegistrationBefore(item, currentItem);
    }
  }

  private isDraftBefore(item: MyVirtualScrollItem, currentItem: MyVirtualScrollItem) {
    if (currentItem.type === 'sent' || (item.type === 'sync' && currentItem.type === 'draft')) {
      return true;
    } else if (currentItem.type === item.type) {
      return item.id < currentItem.id;
    } else {
      return false;
    }
  }

  private isRegistrationBefore(item: MyVirtualScrollItem, currentItem: MyVirtualScrollItem) {
    if (currentItem.type === 'draft' || currentItem.type === 'sync') {
      return false;
    } else if (item.type === 'sent' && currentItem.type === 'sent') {
      return moment((<RegistrationViewModel>item.item).DtObsTime).isAfter(moment((<RegistrationViewModel>currentItem.item).DtObsTime));
    } else {
      return false;
    }
  }

  private initVirtualItems(virtualItems: MyVirtualScrollItem[]) {
    this.ngZone.run(() => {
      this.virtualItems = virtualItems;
    });
    setTimeout(() => {
      this.virtualItems = [...virtualItems];
      setTimeout(() => {
        this.ngZone.run(() => {
          this.loaded = true;
        });
      }, 500);
    }, 500);
  }

  myHeaderFn(record: MyVirtualScrollItem, index: number, items: MyVirtualScrollItem[]) {
    if (index <= 0) {
      return LIST_HEADERS[record.type];
    } else {
      const prev = items[index - 1];
      if (prev.type !== record.type) {
        return LIST_HEADERS[record.type];
      }
    }
    return null;
  }

  private getVirtualScrollItemsObservable() {
    return combineLatest(
      this.getSyncItemsObservable(),
      this.getDraftObservable(),
      this.getSentObservable())
      .pipe(map(([a, b, c]) => ([...a, ...b, ...c])));
  }

  private getSentObservable(): Observable<MyVirtualScrollItem[]> {
    return this.myObservations.asObservable().pipe(
      distinctUntilChanged<RegistrationViewModel[], string>
        ((a, b) => a.localeCompare(b) === 0, (keySelector) => this.getDistinctRegistrationList(keySelector)),
      map((val) => val.map((item) => ({ type: <'sent'>'sent', id: item.RegID.toString(), item }))));
  }

  private getDraftObservable(): Observable<MyVirtualScrollItem[]> {
    return this.registrationService.drafts$.pipe(
      map((val) => val.map((item) => ({ type: <'draft'>'draft', id: item.id, item }))));
  }

  private getSyncItemsObservable(): Observable<MyVirtualScrollItem[]> {
    return this.registrationService.getRegistrationsToSync().pipe(
      distinctUntilChanged<IRegistration[], string>((a, b) => a.localeCompare(b) === 0,
        (keySelector) => this.getDistinctSyncItemList(keySelector)),
      map((val) => val.map((item) => ({ type: <'sync'>'sync', id: item.id, item }))));
  }

  getDistinctRegistrationList(arr: RegistrationViewModel[]) {
    return arr ? arr.map((reg) => `${reg.RegID}-${reg.DtChangeTime}`).join('#') : '';
  }

  getDistinctSyncItemList(arr: IRegistration[]) {
    return arr ? arr.map((reg) => `${reg.id}`).join('#') : '';
  }

  ngOnDestroy(): void {
    if (this.registrationSubscription) {
      this.registrationSubscription.unsubscribe();
    }
  }

  async loadData(cancel?: Promise<any>) {
    const currentValue = this.myObservations.value;
    const numberOfRecords = 10;
    const pageNumber = Math.floor(currentValue.length / numberOfRecords);
    const subscription = this.userSettingService.appModeAndLanguage$.pipe(switchMap(([appMode, langKey]) =>
      this.observationService.getObservationsForCurrentUser(appMode, this.user, langKey, pageNumber, numberOfRecords)
    )).subscribe((val) => {
      currentValue.push(...val);
      this.myObservations.next(currentValue);
      this.ngZone.run(() => {
        this.firstDataLoad = true;
        this.infiniteScroll.complete();
      });
    }, (_) => {
      this.ngZone.run(() => {
        this.infiniteScroll.complete();
      });
    });
    if (cancel) {
      cancel.then(() => {
        subscription.unsubscribe();
      });
    }
  }
  // trackByRegId(index: number, obs: RegistrationViewModel) {
  //   return obs ? obs.RegID : undefined;
  // }

}
