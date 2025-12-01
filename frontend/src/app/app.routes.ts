import { Routes } from '@angular/router';
import { LoginPageComponent } from './features/auth/login-page/login-page.component';
import { RegisterPageComponent } from './features/auth/register-page/register-page.component';
import { AuthorsPageComponent } from './features/authors/authors-page.component';
import { BooksPageComponent } from './features/books/books-page.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },

  { path: 'authors', component: AuthorsPageComponent, canActivate: [authGuard] },
  { path: 'books', component: BooksPageComponent, canActivate: [authGuard] },

  { path: '', redirectTo: 'authors', pathMatch: 'full' },
];