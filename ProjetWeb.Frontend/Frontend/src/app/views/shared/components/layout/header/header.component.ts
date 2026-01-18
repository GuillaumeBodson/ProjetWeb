import {Component, inject, signal} from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {LayoutService} from '../layout.service';

@Component({
  selector: 'app-header',
  imports: [
    MatToolbar,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  layoutService = inject(LayoutService);
  title = signal("Paddle sites manager");
}
