export type Categoria =
  | "eletronico"
  | "eletrodomestico"
  | "veiculo"
  | "movel"
  | "ferramenta"
  | "outro";

export const CATEGORIAS: {
  value: Categoria;
  label: string;
  emoji: string;
  cor: string;
}[] = [
  { value: "eletronico", label: "Eletrônico", emoji: "📱", cor: "#5b8def" },
  { value: "eletrodomestico", label: "Eletrodoméstico", emoji: "🔌", cor: "#10b4a6" },
  { value: "veiculo", label: "Veículo", emoji: "🚗", cor: "#f0803c" },
  { value: "movel", label: "Móvel", emoji: "🛋️", cor: "#b06ae0" },
  { value: "ferramenta", label: "Ferramenta", emoji: "🛠️", cor: "#e0a92e" },
  { value: "outro", label: "Outro", emoji: "📦", cor: "#7c8699" },
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
