import {
  Component,
  HostListener,
  inject,
  signal,
  effect,
  DOCUMENT,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type Theme = 'light' | 'dark';

const THEME_META_COLOR: Record<Theme, string> = {
  light: '#f2f0e3',
  dark: '#0a0e14',
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  private doc = inject(DOCUMENT);

  scrolled = signal(false);
  menuOpen = signal(false);
  activeSection = signal<'about' | 'projects' | null>(null);
  theme = signal<Theme>(this.initialTheme());

  @HostListener('window:scroll')
  onScroll(): void {
    const y = this.doc.defaultView?.scrollY ?? 0;
    this.scrolled.set(y > 16);
  }

  @HostListener('window:resize')
  onResize(): void {
    if ((this.doc.defaultView?.innerWidth ?? 0) > 768) {
      this.closeMenu();
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleTheme(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.applyTheme(next);
  }

  scrollTo(section: string): void {
    const el = this.doc.getElementById(section);
    if (!el) return;
    const headerHeight = this.doc.querySelector('.navbar')?.getBoundingClientRect().height ?? 72;
    const top = el.getBoundingClientRect().top + (this.doc.defaultView?.scrollY ?? 0) - headerHeight - 8;
    this.doc.defaultView?.scrollTo({ top, behavior: 'smooth' });
    this.activeSection.set(section as 'about' | 'projects');
  }

  constructor() {

    effect(() => {
      this.doc.body.style.overflow = this.menuOpen() ? 'hidden' : '';
    });
  }

  private initialTheme(): Theme {
    const attr = this.doc.documentElement.getAttribute('data-theme');
    return attr === 'dark' ? 'dark' : 'light';
  }

  private applyTheme(theme: Theme): void {
    this.doc.documentElement.setAttribute('data-theme', theme);

    try {
      localStorage.setItem('theme', theme);
    } catch {

    }

    const meta = this.doc.getElementById('theme-color');
    meta?.setAttribute('content', THEME_META_COLOR[theme]);
  }
}
