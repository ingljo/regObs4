import { Observable } from 'rxjs';

export class ObservableHelper {
    static toPromiseWithCancel<T>(observable: Observable<T>, cancel?: Promise<void>) {
        return new Promise<T>((resolve, reject) => {
            const subscription = observable
                .subscribe((result) => {
                    resolve(result);
                }, (error) => {
                    reject(error);
                });
            if (cancel) {
                cancel.then(() => {
                    subscription.unsubscribe();
                    reject(new Error('Cancelled'));
                });
            }
        });
    }
}
