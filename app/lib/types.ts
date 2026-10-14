export type Categoria =
  | "eletronico"
  | "eletrodomestico"
  | "veiculo"
  | "movel"
  | "ferramenta"
  | "outro";

export const CATEGORIAS: { value: Categoria; label: string; emoji: string }[] = [
  { value: "eletronico", label: "Eletrônico", emoji: "📱" },
  { value: "eletrodomestico", label: "Eletrodoméstico", emoji: "🔌" },
  { value: "veiculo", label: "Veículo", emoji: "🚗" },
  { value: "movel", label: "Móvel", emoji: "🛋️" },
  { value: "ferramenta", label: "Ferramenta", emoji: "🛠️" },
  { value: "outro", label: "Outro", emoji: "📦" },
];

export interface Item {
  id: string;
  nome: string;
  categoria: Categoria;
  loja?: string;
  dataCompra: string; // ISO (YYYY-MM-DD)
  garantiaMeses: number;
  valor?: number;
  notaFoto?: string; // data URL (base64)
  // Manutenção recorrente (opcional)
  manutencaoMeses?: number;
  ultimaManutencao?: string; // ISO
  obs?: string;
  criadoEm: string; // ISO datetime
}

export type ItemInput = Omit<Item, "id" | "criadoEm">;
