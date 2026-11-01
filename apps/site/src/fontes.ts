import { Azeret_Mono, Instrument_Serif, Inter_Tight } from 'next/font/google';

// As três famílias da marca, as mesmas nas duas línguas.
const sans = Inter_Tight({ subsets: ['latin'], weight: ['400', '500', '700', '800'], variable: '--sans' });
const mono = Azeret_Mono({ subsets: ['latin'], weight: ['400'], variable: '--mono' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], variable: '--serif' });

export const classesDasFontes = `${sans.variable} ${mono.variable} ${serif.variable}`;
