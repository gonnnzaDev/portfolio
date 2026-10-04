import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
} from '@angular/core';

interface Column {
  x: number;
  y: number;
  speed: number;
}

@Component({
  imports: [],
  selector: 'app-tux-rain',
  styleUrl: './tux-rain.css',
  templateUrl: './tux-rain.html',
})
export class TuxRain implements OnDestroy {
  private readonly host = inject(ElementRef);
  private readonly win: Window = this.host.nativeElement.ownerDocument
    .defaultView!;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private columns: Column[] = [];
  private frameId: number | null = null;
  private observer: MutationObserver | null = null;
  private ready = false;

  private img: HTMLImageElement | null = null;

  private sprite: HTMLCanvasElement | null = null;
  private accent = '';

  private staticMode = false;
  private opacity = 0.45;

  private readonly glyphW = 44;
  private glyphH = 44;

  private readonly spacing = 70;

  constructor() {
    afterNextRender(() => this.init());
  }

  ngOnDestroy(): void {
    if (this.frameId !== null) this.win.cancelAnimationFrame(this.frameId);
    this.win.removeEventListener('resize', this.onResize);
    this.observer?.disconnect();
  }

  private init(): void {
    this.canvas = this.host.nativeElement.querySelector('canvas');
    this.ctx = this.canvas?.getContext('2d') ?? null;
    if (!this.canvas || !this.ctx) return;

    this.readTheme();
    this.layout();

    this.observer = new MutationObserver(() => this.readTheme());
    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    this.win.addEventListener('resize', this.onResize);

    const img = new Image();
    img.onload = () => this.start(img);
    img.onerror = () => this.start(null);
    img.src = 'rain.svg';
  }

  private start(img: HTMLImageElement | null): void {
    this.img = img;
    if (img) {
      const ratio =
        img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
      this.glyphH = Math.round(this.glyphW * ratio);
    }

    this.ready = true;
    this.buildSprite();

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    this.staticMode = reduced || !this.sprite;
    this.layout();
  }

  private readTheme(): void {
    this.opacity =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--rain-opacity',
        ),
      ) || this.opacity;

    if (!this.ready) return;
    this.buildSprite();
    this.refresh();
  }

  private buildSprite(): void {
    if (!this.img) return;
    const accent =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--accent')
        .trim() || '#2563eb';
    if (accent === this.accent && this.sprite) return;

    this.sprite = raster(this.img, this.glyphW, this.glyphH, accent);
    this.accent = accent;
  }

  private readonly onResize = () => this.layout();

  private refresh(): void {
    if (this.staticMode) this.paintStatic();
    else this.paintBase();
  }

  private layout(): void {
    const cv = this.canvas;
    const ctx = this.ctx;
    if (!cv || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    if (w === 0 || h === 0) return;

    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.columns = this.gutterXs(w).map((x) => ({
      x,
      y: Math.random() * h,
      speed: this.speed(),
    }));

    this.refresh();
    if (this.ready && !this.staticMode && this.frameId === null) {
      this.frameId = this.win.requestAnimationFrame(this.tick);
    }
  }

  private gutterXs(w: number): number[] {
    const pad = (this.spacing - this.glyphW) / 2;
    const panel = document.querySelector<HTMLElement>('.app-container');

    let bands: Array<[number, number]>;
    if (panel) {
      const rect = panel.getBoundingClientRect();
      bands = [
        [0, rect.left],
        [rect.right, w],
      ];
    } else {
      bands = [
        [0, w * 0.05],
        [w * 0.95, w],
      ];
    }

    const xs: number[] = [];
    for (const [from, to] of bands) {
      for (let x = from + pad; x + this.glyphW <= to; x += this.spacing) {
        xs.push(x);
      }
    }
    return xs;
  }

  private speed(): number {
    return 3 + Math.random() * 5;
  }

  private paintBase(): void {
    const cv = this.canvas;
    const ctx = this.ctx;
    if (!cv || !ctx) return;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, cv.clientWidth, cv.clientHeight);
  }

  private tick = () => {
    this.paint();
    this.frameId = this.win.requestAnimationFrame(this.tick);
  };

  private paint(): void {
    const cv = this.canvas;
    const ctx = this.ctx;
    if (!cv || !ctx) return;
    const w = cv.clientWidth;
    const h = cv.clientHeight;

    if (w === 0 || h === 0 || this.columns.length === 0) return;

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);

    const sprite = this.sprite;
    if (!sprite) return;

    ctx.globalAlpha = this.opacity;
    for (const col of this.columns) {
      ctx.drawImage(sprite, col.x, col.y, this.glyphW, this.glyphH);
      col.y += col.speed;

      if (col.y > h) {
        col.y = -this.glyphH - Math.random() * 260;
        col.speed = this.speed();
      }
    }
    ctx.globalAlpha = 1;
  }

  private paintStatic(): void {
    const cv = this.canvas;
    const ctx = this.ctx;
    if (!cv || !ctx) return;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    const sprite = this.sprite;

    this.paintBase();
    if (!sprite || w === 0 || h === 0) return;

    const rowStep = this.spacing * 1.6;
    ctx.globalAlpha = this.opacity * 0.7;
    for (const x of this.gutterXs(w)) {
      for (let y = 0; y + this.glyphH <= h; y += rowStep) {
        if (Math.random() > 0.45) continue;
        ctx.drawImage(sprite, x, y, this.glyphW, this.glyphH);
      }
    }
    ctx.globalAlpha = 1;
  }
}

function raster(
  img: HTMLImageElement,
  w: number,
  h: number,
  color: string,
): HTMLCanvasElement | null {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, c.width, c.height);

  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.globalCompositeOperation = 'source-over';

  return c;
}
