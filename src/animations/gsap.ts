import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Single registration point — always import gsap/ScrollTrigger from here.
export { gsap, ScrollTrigger };
