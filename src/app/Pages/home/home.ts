import { Component } from '@angular/core';
import { About } from '../../Components/about/about';
import { Projects } from '../../Components/projects/projects';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [About, Projects],
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {}
