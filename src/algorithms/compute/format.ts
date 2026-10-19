import type { Complex } from './types';

export function formatNumber(value: number) {
  const rounded = Math.round(value * 100) / 100;
  if (Object.is(rounded, -0) || Math.abs(rounded) < 0.005) return '0';
  return String(rounded);
}

export function formatComplex(value: Complex) {
  const re = Math.round(value.re * 100) / 100;
  const im = Math.round(value.im * 100) / 100;
  const reZero = Math.abs(re) < 0.005;
  const imZero = Math.abs(im) < 0.005;
  if (reZero && imZero) return '0';
  if (imZero) return formatNumber(re);
  const imBody = Math.abs(Math.abs(im) - 1) < 0.005 ? 'i' : `${formatNumber(Math.abs(im))}i`;
  const imText = im < 0 ? `-${imBody}` : imBody;
  if (reZero) return imText;
  return `${formatNumber(re)}${im < 0 ? '' : '+'}${imText}`;
}
