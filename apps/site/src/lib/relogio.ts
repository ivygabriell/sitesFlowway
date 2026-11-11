const DIAS = { pt: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'], en: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] };
const doisDigitos = (n: number) => String(n).padStart(2, '0');

// Formato do relógio do cabeçalho: "REC ter13:07:05".
export const relogio = (d: Date, idioma: 'pt' | 'en' = 'pt') =>
  `REC ${DIAS[idioma][d.getDay()]}${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}:${doisDigitos(d.getSeconds())}`;
