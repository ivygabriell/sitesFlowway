import { ScrollTrigger, gsap } from '@/gsap';

// O ScrollTrigger e o relógio do GSAP continuam pedindo quadros depois que o teste acaba. Sem parar os
// dois, o intervalo do ScrollTrigger dispara depois que o jsdom saiu ("requestAnimationFrame is not defined").
export function encerrarAnimacoes() {
  ScrollTrigger.disable();
  gsap.ticker.sleep();
}
