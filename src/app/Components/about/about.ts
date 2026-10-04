import { Component } from '@angular/core';
import { Reveal } from '../../Directives/reveal';

@Component({
  imports: [Reveal],
  selector: 'app-about',
  styleUrl: './about.css',
  templateUrl: './about.html',
})
export class About {}
