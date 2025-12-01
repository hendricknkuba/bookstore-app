import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css'],
})
export class RegisterPageComponent {
  model = { email: '', password: '' };

  constructor(public auth: AuthService, private router: Router) {}

  async onSubmit(form: NgForm) {
    if (form.invalid || this.auth.loading()) return;

    await this.auth.register(this.model.email, this.model.password);

    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/books']);
    }
  }
}
