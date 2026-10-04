import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './Components/header/header';
import { Footer } from './Components/footer/footer';
import { TuxRain } from './Components/tux-rain/tux-rain';

@Component({
  imports: [RouterOutlet, Header, Footer, TuxRain],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('portfolio');
}
