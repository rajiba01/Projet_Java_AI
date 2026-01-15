import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environnments/environment';

export type Role = 'user' | 'assistant';
export interface ChatMessage { role: Role; content: string; }

export interface ChatContext {
  type?: string; // ex: 'HUILE', 'BANANE', ...
  // تنجم تزيد بعد: region, budget, etc.
  [k: string]: any;
}

interface ChatRequest {
  messages: ChatMessage[];
  langMode: 'auto' | 'fr' | 'ar' | 'en' | 'tn';
  context?: ChatContext; // NEW
}

export interface ImageAnalysisResponse {
  score: number;
  verdict: string;
  extracted_text: string;
  checklist: Record<string, any>;
  advice: string;
  languageHint?: 'fr' | 'ar' | 'en' | 'tn';
}

interface ChatResponse {
  reply: string;
  languageHint?: 'fr' | 'ar' | 'en' | 'tn';
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly baseUrl = environment.chatUrl;
  private readonly chatUrl = `${this.baseUrl}/chat`;

  constructor(private http: HttpClient) {}

  // قبل: chat(messages, langMode)
  // توّا: chat(messages, langMode, context?)
  chat(messages: ChatMessage[], langMode: ChatRequest['langMode'], context?: ChatContext) {
    const body: ChatRequest = { messages, langMode, context };
    return this.http.post<ChatResponse>(this.chatUrl, body);
  }

  analyzeImage(file: File, langMode: 'auto' | 'fr' | 'ar' | 'en' | 'tn') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('langMode', langMode);
    return this.http.post<ImageAnalysisResponse>(`${this.baseUrl}/analyze_image`, fd);
  }
}