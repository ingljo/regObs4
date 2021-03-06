import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { LoginService } from '../../modules/login/services/login.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(private router: Router, private loginService: LoginService) { }

  async canActivate(
    _: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {

    const loggedInUser = await this.loginService.getLoggedInUser();
    if (!loggedInUser.isLoggedIn) {
      this.router.navigate(['login'], {
        queryParams: {
          returnUrl: state.url
        }
      });
    }
    return loggedInUser.isLoggedIn;
  }
}
