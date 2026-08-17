import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combina clases de Tailwind resolviendo los conflictos a favor de la última. */
export function cn(...entradas: ClassValue[]): string {
  return twMerge(clsx(entradas));
}

/** Iniciales de un nombre completo, en mayúsculas y como máximo dos letras. */
export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((palabra) => palabra.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
