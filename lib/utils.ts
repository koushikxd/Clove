import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLabelStyles(color: string) {
  const hexColor = color.startsWith("#") ? color : `#${color}`;

  return {
    backgroundColor: `${hexColor}20`,
    borderColor: `${hexColor}70`,
    color: hexColor,
  };
}
