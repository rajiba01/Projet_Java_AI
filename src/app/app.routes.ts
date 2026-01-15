import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { ProduitDetailsComponent } from './pages/produit-details/produit-details.component';
import { ForecastDashboardComponent } from './pages/forecast-dashboard/forecast-dashboard.component';
import { HomeFournisseurComponent } from './pages/home-fournisseur/home-fournisseur.component';
import { FournisseurCommandesComponent } from './pages/fournisseur-commandes/fournisseur-commandes.component';
import { FournisseurGuard } from './services/fournisseur.guard';
import { VirtualizeComponent } from './pages/virtualize/virtualize.component';
import { ProductTypeComponent } from './pages/product-type/product-type.component';
export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'home', component: HomeComponent },
      { path: 'virtualize', component: VirtualizeComponent },
      { path: 'product/:id', component: ProduitDetailsComponent }, // <- page détail produit (par id)
      { path: 'product/type/:type', component: ProductTypeComponent },
      { path: 'forecast-dashboard', component: ForecastDashboardComponent },
      { path: 'home-fournisseur', component: HomeFournisseurComponent, canActivate: [FournisseurGuard] },
  { path: 'fournisseur-commandes', component: FournisseurCommandesComponent, canActivate: [FournisseurGuard] },
  
      ]
  }
];
