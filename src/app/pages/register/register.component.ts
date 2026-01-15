import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    user: User = {
    prenom: '',
    nom: '',
    email: '',
    mdp: '',
    localisation: '',
    tel: 0,
    role: ''
  };
   constructor(private userService: UserService, ) {}

  onSubmit(): void {
    console.log('User envoyé :', this.user);

    this.userService.createUser(this.user).subscribe({
      next: (response) => {
        console.log('Succès :', response);
        alert('User créé avec succès');
      },
      error: (error) => {
        console.error('Erreur API :', error);
        alert('Erreur lors de la création du user');
      }
    });
  }
}
