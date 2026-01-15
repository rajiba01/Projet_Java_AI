import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.css']
})
export class ChatWidgetComponent {
  open = false;
  input = '';
  sending = false;

  langMode: 'auto' | 'fr' | 'ar' | 'en' | 'tn' = 'auto';

  // NEW: current product type from route param (/product/type/:type)
  contextType?: string;

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      content:
        'Salut ! Donne-moi: région + prix aujourd’hui (DT/L) + horizon (7 ou 30). Je te dis acheter maintenant ou attendre.'
    }
  ];

  // voice
  listening = false;
  private recognition: any | null = null;

  @ViewChild('scroll') scrollRef!: ElementRef<HTMLDivElement>;

  constructor(
    private chat: ChatService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // initial
    this.refreshContextType();

    // on every navigation
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.refreshContextType());
  }

  private refreshContextType(): void {
    // get deepest active route
    let r: ActivatedRoute | null = this.route;
    while (r?.firstChild) r = r.firstChild;

    const type = r?.snapshot?.paramMap?.get('type');
    this.contextType = type ? type.toUpperCase().trim() : undefined;
  }

  toggle(): void {
    this.open = !this.open;
    setTimeout(() => this.scrollToBottom(), 0);
  }

  send(): void {
    const text = this.input.trim();
    if (!text || this.sending) return;

    this.messages.push({ role: 'user', content: text });
    this.input = '';
    this.scrollToBottom();

    this.sending = true;

    // NEW: pass context to backend
    const ctx = this.contextType ? { type: this.contextType } : undefined;

    this.chat.chat(this.messages, this.langMode, ctx).subscribe({
      next: (res) => {
        this.sending = false;
        this.messages.push({ role: 'assistant', content: res.reply });
        this.scrollToBottom();
        this.speak(res.reply, res.languageHint);
      },
      error: (err) => {
        this.sending = false;
        this.messages.push({
          role: 'assistant',
          content: err?.error?.detail ?? "Désolé, j'ai eu un problème. Réessaie."
        });
        this.scrollToBottom();
      }
    });
  }

  scrollToBottom(): void {
    const el = this.scrollRef?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }


  // STT
  toggleMic(): void {
    if (this.listening) this.stopListening();
    else this.startListening();
  }

  startListening(): void {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this.messages.push({ role: 'assistant', content: "Ton navigateur ne supporte pas la reconnaissance vocale." });
      return;
    }

    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.lang =
      this.langMode === 'fr' ? 'fr-FR' :
      this.langMode === 'en' ? 'en-US' :
      'ar-SA';

    this.recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      this.input = (this.input ? this.input + ' ' : '') + transcript;
      this.stopListening();
    };
    this.recognition.onerror = () => this.stopListening();
    this.recognition.onend = () => this.stopListening();

    this.listening = true;
    this.recognition.start();
  }

  stopListening(): void {
    try { this.recognition?.stop(); } catch {}
    this.listening = false;
    this.recognition = null;
  }
onFileSelected(e: Event): void {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // Show user message
  this.messages.push({ role: 'user', content: `[Photo envoyée: ${file.name}]` });
  this.scrollToBottom();

  this.sending = true;
  this.chat.analyzeImage(file, this.langMode).subscribe({
    next: (res) => {
      this.sending = false;
      const msg =
        `Analyse qualité (photo)\n` +
        `Score: ${res.score}/100 | Verdict: ${res.verdict}\n\n` +
        `${res.advice}\n\n` +
        `---\nTexte détecté (OCR):\n${res.extracted_text}`;
      this.messages.push({ role: 'assistant', content: msg });
      this.scrollToBottom();
      this.speak(res.advice, res.languageHint);
    },
    error: (err) => {
      this.sending = false;
      this.messages.push({ role: 'assistant', content: err?.error?.detail ?? 'Erreur analyse image.' });
      this.scrollToBottom();
    }
  });

  // allow selecting same file again
  input.value = '';
}
  // TTS
  speak(text: string, hint?: 'fr' | 'ar' | 'en' | 'tn'): void {
    if (!('speechSynthesis' in window)) return;
    if (!this.open) return;

    const u = new SpeechSynthesisUtterance(text);
    const target = hint || (this.langMode === 'auto' ? 'fr' : this.langMode);

    u.lang = target === 'en' ? 'en-US' : target === 'fr' ? 'fr-FR' : 'ar-SA';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}