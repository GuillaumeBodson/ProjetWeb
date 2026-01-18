import {Component, inject} from '@angular/core';
import {MatListItem} from '@angular/material/list';
import {RouterLink} from '@angular/router';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {LayoutService} from '../layout.service';

@Component({
  selector: 'app-menu',
  imports: [
    MatListItem,
    RouterLink,
    MatToolbar,
    MatIcon,
    MatIconButton
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {

  layoutService = inject(LayoutService)
}
