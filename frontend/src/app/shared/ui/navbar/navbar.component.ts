import { Component, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  constructor(public auth: AuthService, private router: Router) {}

  userEmail = computed(() => this.auth.user()?.email ?? '');

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}