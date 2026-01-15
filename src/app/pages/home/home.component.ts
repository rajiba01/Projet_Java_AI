import { Component, AfterViewInit, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../services/auth.service';
import { AnnoncePublicApiService, PublicAnnonce } from '../../services/annonce-public-api.service';
import { Produit } from '../../models/produit.model';
import { Annonce } from '../../models/annonce.model';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, RouterLink]
})
export class HomeComponent implements OnInit, AfterViewInit {

  scrollToSection(event: Event, sectionId: string) {
    event.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
  region = 'sfax';
  horizon = 7;

  publicAnnonces: PublicAnnonce[] = [];
  loadingMarket = false;
  errorMarket = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private annonceApi: AnnoncePublicApiService
  ) {
    // Fallback: récupérer l'email passé par login (si storage bloqué)
    this.route.queryParamMap.subscribe(params => {
      const email = params.get('email');
      if (email) {
        this.authService.setUser({ email });
      }
    });
  }

  ngOnInit(): void {
  
  }

 // loadMarketplace(): void {
   // this.loadingMarket = true;
  //  this.errorMarket = '';

    //this.annonceApi.list().subscribe({
      //next: (data) => {
        //this.publicAnnonces = data ?? [];
        //this.loadingMarket = false;
      //},
     // error: (err) => {
       // const msg = err?.error?.message ?? err?.error ?? err?.message;
        //const status = err?.status ? `HTTP ${err.status}` : '';
        //this.errorMarket = [status, msg].filter(Boolean).join(' - ') || 'Erreur chargement annonces';
        //this.loadingMarket = false;
     // }
   // });
  //}""""

 
  ngAfterViewInit(): void {
    // -------------------------------
    // 1. Hamburger Menu Mobile
    // -------------------------------
    const hamburger = document.getElementById('hamburger') as HTMLElement;
    const navLinks = document.getElementById('navLinks') as HTMLElement;

    hamburger?.addEventListener('click', () => navLinks?.classList.toggle('active'));
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => navLinks?.classList.remove('active'));
    });

    // -------------------------------
    // 2. Scroll Reveal
    // -------------------------------
    const revealElements = document.querySelectorAll('.reveal');
    const revealOnScroll = () => {
      const windowHeight = window.innerHeight;
      const elementVisible = 150;
      revealElements.forEach(reveal => {
        const el = reveal as HTMLElement;
        const elementTop = el.getBoundingClientRect().top;
        if (elementTop < windowHeight - elementVisible) {
          el.classList.add('visible');
        }
      });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    // -------------------------------
    // 3. Counters Animés (Stats)
    // -------------------------------
    const statsSection = document.querySelector('.stats-section') as HTMLElement;
    let countersStarted = false;

    const startCounters = () => {
      const counters = document.querySelectorAll('.stat-number');
      counters.forEach(counter => {
        const el = counter as HTMLElement;
        const target = +el.getAttribute('data-target')!;
        const increment = target / 100;

        const updateCounter = () => {
          const count = +el.innerText.replace('+', '');
          if (count < target) {
            el.innerText = Math.ceil(count + increment).toString();
            setTimeout(updateCounter, 20);
          } else {
            el.innerText = target.toString() + "+";
          }
        };
        updateCounter();
      });
    };

    const observer = new IntersectionObserver((entries) => {
      if(entries[0].isIntersecting && !countersStarted) {
        startCounters();
        countersStarted = true;
      }
    }, { threshold: 0.5 });

    observer.observe(statsSection);

    // -------------------------------
    // 4. Toast Notification Formulaire
    // -------------------------------
    const contactForm = document.getElementById('contactForm') as HTMLFormElement;
    const toast = document.getElementById('notificationToast') as HTMLElement;

    contactForm?.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button') as HTMLButtonElement;
      const originalText = btn.innerText;
      btn.innerText = 'Envoi en cours...';

      setTimeout(() => {
        contactForm.reset();
        btn.innerText = originalText;
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 3000);
      }, 1500);
    });

    // -------------------------------
    // 5. Hero Canvas Particules
    // -------------------------------
    const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let particlesArray: Particle[];

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = 'rgba(46, 125, 50, 0.2)';
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
        if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initParticles() {
      particlesArray = [];
      const numberOfParticles = (canvas.width * canvas.height) / 15000;
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesArray.forEach(p => {
        p.update();
        p.draw();
      });
      connectParticles();
      requestAnimationFrame(animateParticles);
    }

    function connectParticles() {
      let opacityValue = 1;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = dx * dx + dy * dy;
          if (distance < (canvas.width/7) * (canvas.height/7)) {
            opacityValue = 1 - (distance / 20000);
            ctx.strokeStyle = `rgba(46, 125, 50, ${opacityValue * 0.1})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    }

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    });

    initParticles();
    animateParticles();
  }
}