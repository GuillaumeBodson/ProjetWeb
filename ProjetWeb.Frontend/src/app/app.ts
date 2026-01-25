import {Component, inject, signal} from '@angular/core';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';
import {HeaderComponent} from './views/shared/components/layout/header/header.component';
import {ContentComponent} from './views/shared/components/layout/content/content.component';
import {FooterComponent} from './views/shared/components/layout/footer/footer.component';
import {MenuComponent} from './views/shared/components/layout/menu/menu.component';
import {MatNavList} from '@angular/material/list';
import {LayoutService} from './views/shared/components/layout/layout.service';

@Component({
  selector: 'app-root',
  imports: [MatSidenavContainer, MatSidenav, HeaderComponent, ContentComponent, FooterComponent, MenuComponent, MatSidenavContent, MatNavList],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Frontend');
  layoutService = inject(LayoutService);

}
