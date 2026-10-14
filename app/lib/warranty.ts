import { Item } from "./types";

export type StatusGarantia = "ativa" | "vence-breve" | "vencida" | "sem-garantia";

const DIAS_ALERTA = 30; // alerta quando faltam <= 30 dias

function addMeses(dataISO: string, meses: number): Date {
  const d = new Date(dataISO + "T00:00:00");
  d.setMonth(d.getMonth() + meses);
  return d;
}

function hoje(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDias(ate: Date): number {
  const ms = ate.getTime() - hoje().getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function vencimentoGarantia(item: Item): Date | null {
  if (!item.garantiaMeses || item.garantiaMeses <= 0) return null;
  return addMeses(item.dataCompra, item.garantiaMeses);
}

export function diasRestantesGarantia(item: Item): number | null {
  const v = vencimentoGarantia(item);
  if (!v) return null;
  return diffDias(v);
}

export function statusGarantia(item: Item): StatusGarantia {
  const dias = diasRestantesGarantia(item);
  if (dias === null) return "sem-garantia";
  if (dias < 0) return "vencida";
  if (dias <= DIAS_ALERTA) return "vence-breve";
  return "ativa";
}

/** Fração decorrida da garantia, de 0 (recém-comprado) a 1 (vencida). */
export function progressoGarantia(item: Item): number | null {
  const venc = vencimentoGarantia(item);
  if (!venc) return null;
  const inicio = new Date(item.dataCompra + "T00:00:00").getTime();
  const fim = venc.getTime();
  const agora = hoje().getTime();
  if (fim <= inicio) return 1;
  const frac = (agora - inicio) / (fim - inicio);
  return Math.max(0, Math.min(1, frac));
}

export function proximaManutencao(item: Item): Date | null {
  if (!item.manutencaoMeses || item.manutencaoMeses <= 0) return null;
  const base = item.ultimaManutencao || item.dataCompra;
  return addMeses(base, item.manutencaoMeses);
}

export function diasRestantesManutencao(item: Item): number | null {
  const p = proximaManutencao(item);
  if (!p) return null;
  return diffDias(p);
}

export interface Alerta {
  item: Item;
  tipo: "garantia" | "manutencao";
  dias: number; // dias restantes (negativo = já passou)
  titulo: string;
  descricao: string;
}

export function gerarAlertas(itens: Item[]): Alerta[] {
  const alertas: Alerta[] = [];
  for (const item of itens) {
    const dG = diasRestantesGarantia(item);
    if (dG !== null && dG <= DIAS_ALERTA) {
      alertas.push({
        item,
        tipo: "garantia",
        dias: dG,
        titulo:
          dG < 0
            ? `Garantia de ${item.nome} venceu`
            : `Garantia de ${item.nome} vence em breve`,
        descricao:
          dG < 0
            ? `Venceu há ${Math.abs(dG)} dia(s)`
            : `Faltam ${dG} dia(s) — ${formatarData(vencimentoGarantia(item)!)}`,
      });
    }
    const dM = diasRestantesManutencao(item);
    if (dM !== null && dM <= DIAS_ALERTA) {
      alertas.push({
        item,
        tipo: "manutencao",
        dias: dM,
        titulo:
          dM < 0
            ? `Manutenção de ${item.nome} atrasada`
            : `Manutenção de ${item.nome} se aproxima`,
        descricao:
          dM < 0
            ? `Atrasada há ${Math.abs(dM)} dia(s)`
            : `Faltam ${dM} dia(s) — ${formatarData(proximaManutencao(item)!)}`,
      });
    }
  }
  // Mais urgente primeiro
  return alertas.sort((a, b) => a.dias - b.dias);
}

export function formatarData(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
