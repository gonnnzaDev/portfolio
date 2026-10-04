import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class Reveal implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef>(ElementRef);
  private readonly observer = new IntersectionObserver(
    (entries) => this.handle(entries),
    { threshold: 0, rootMargin: '0px 0px -60px 0px' },
  );

  ngOnInit(): void {
    this.el.nativeElement.classList.add('reveal');
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer.disconnect();
  }

  private handle(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('reveal--visible');
      this.observer.unobserve(entry.target);
    }
  }
}
