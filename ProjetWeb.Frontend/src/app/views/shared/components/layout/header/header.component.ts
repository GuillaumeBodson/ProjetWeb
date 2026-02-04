import {Component, inject, signal} from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {LayoutService} from '../layout.service';
import {RouterLink} from '@angular/router';
import {AuthStateService} from '../../../../../core/services/auth-state.service';
import {AuthFacadeService} from '../../../../../core/services/auth-facade.service';

@Component({
  selector: 'app-header',
  imports: [
    MatToolbar,
    MatIconModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private readonly authState = inject(AuthStateService);
  private readonly authFacade = inject(AuthFacadeService);
  readonly layoutService = inject(LayoutService);

  readonly user = this.authState.user;
  readonly isAuthenticated = this.authState.isAuthenticated;

  logout(): void {
    this.authFacade.logout();
  }
  title = signal("Paddle sites manager");
}
