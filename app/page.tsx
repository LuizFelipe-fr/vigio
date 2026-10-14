"use client";

import { useEffect, useMemo, useState } from "react";
import { Item, ItemInput, CATEGORIAS } from "./lib/types";
import {
  listarItens,
  salvarItem,
  atualizarItem,
  removerItem,
} from "./lib/db";
import {
  gerarAlertas,
  statusGarantia,
  diasRestantesGarantia,
  vencimentoGarantia,
  proximaManutencao,
  formatarData,
  formatarMoeda,
  StatusGarantia,
} from "./lib/warranty";
import ItemForm from "./components/ItemForm";

const STATUS_META: Record<
  StatusGarantia,
  { label: string; cor: string; bg: string }
> = {
  ativa: { label: "Garantia ativa", cor: "var(--ok)", bg: "color-mix(in srgb, var(--ok) 14%, transparent)" },
  "vence-breve": { label: "Vence em breve", cor: "var(--warn)", bg: "color-mix(in srgb, var(--warn) 16%, transparent)" },
  vencida: { label: "Garantia vencida", cor: "var(--danger)", bg: "color-mix(in srgb, var(--danger) 14%, transparent)" },
  "sem-garantia": { label: "Sem garantia", cor: "var(--muted)", bg: "var(--surface-2)" },
};

export default function Home() {
  const [itens, setItens] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Item | undefined>();
  const [busca, setBusca] = useState("");
  const [detalhe, setDetalhe] = useState<Item | null>(null);

  useEffect(() => {
    listarItens()
      .then(setItens)
      .catch(() => setItens([]))
      .finally(() => setCarregando(false));
  }, []);

  const alertas = useMemo(() => gerarAlertas(itens), [itens]);

  const itensFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const lista = q
      ? itens.filter(
          (i) =>
            i.nome.toLowerCase().includes(q) ||
            (i.loja ?? "").toLowerCase().includes(q)
        )
      : itens;
    return [...lista].sort((a, b) => {
      const da = diasRestantesGarantia(a) ?? Infinity;
      const db = diasRestantesGarantia(b) ?? Infinity;
      return da - db;
    });
  }, [itens, busca]);

  const valorProtegido = useMemo(
    () =>
      itens
        .filter((i) => statusGarantia(i) === "ativa" || statusGarantia(i) === "vence-breve")
        .reduce((s, i) => s + (i.valor ?? 0), 0),
    [itens]
  );
  const garantiasAtivas = useMemo(
    () => itens.filter((i) => statusGarantia(i) !== "vencida" && statusGarantia(i) !== "sem-garantia").length,
    [itens]
  );

  async function handleSalvar(input: ItemInput, id?: string) {
    if (id) {
      const atualizado = { ...(editando as Item), ...input, id };
      await atualizarItem(atualizado);
      setItens((xs) => xs.map((x) => (x.id === id ? atualizado : x)));
    } else {
      const novo = await salvarItem(input);
      setItens((xs) => [...xs, novo]);
    }
    setFormAberto(false);
    setEditando(undefined);
  }

  async function handleRemover(id: string) {
    if (!confirm("Remover este item? Essa ação não pode ser desfeita.")) return;
    await removerItem(id);
    setItens((xs) => xs.filter((x) => x.id !== id));
    setDetalhe(null);
  }

  async function registrarManutencao(item: Item) {
    const atualizado = {
      ...item,
      ultimaManutencao: new Date().toISOString().slice(0, 10),
    };
    await atualizarItem(atualizado);
    setItens((xs) => xs.map((x) => (x.id === item.id ? atualizado : x)));
    setDetalhe(atualizado);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-28">
      {/* Header */}
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-fg text-lg">
            👁️
          </div>
          <div>
            <h1 className="text-xl font-extrabold leading-none">Vigio</h1>
            <p className="text-xs text-muted">garantias &amp; notas sob controle</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3 mb-5">
        <Stat titulo="Itens" valor={itens.length.toString()} />
        <Stat titulo="Garantias ok" valor={garantiasAtivas.toString()} />
        <Stat
          titulo="Protegido"
          valor={valorProtegido > 0 ? formatarMoeda(valorProtegido) : "—"}
        />
      </section>

      {/* Alertas */}
      {alertas.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-semibold text-muted mb-2 px-1">
            ⚠️ Precisa da sua atenção
          </h2>
          <div className="space-y-2">
            {alertas.map((a, idx) => {
              const urgente = a.dias < 0;
              return (
                <button
                  key={idx}
                  onClick={() => setDetalhe(a.item)}
                  className="w-full flex items-center gap-3 rounded-2xl border p-3 text-left"
                  style={{
                    borderColor: urgente ? "var(--danger)" : "var(--warn)",
                    background: urgente
                      ? "color-mix(in srgb, var(--danger) 10%, transparent)"
                      : "color-mix(in srgb, var(--warn) 10%, transparent)",
                  }}
                >
                  <span className="text-xl">
                    {a.tipo === "garantia" ? "🛡️" : "🔧"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[15px] truncate">{a.titulo}</p>
                    <p className="text-sm text-muted">{a.descricao}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Busca */}
      {itens.length > 0 && (
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto ou loja…"
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 mb-4 outline-none focus:border-brand"
        />
      )}

      {/* Lista */}
      {carregando ? (
        <p className="text-muted text-center py-10">Carregando…</p>
      ) : itens.length === 0 ? (
        <EmptyState onAdd={() => setFormAberto(true)} />
      ) : (
        <section className="space-y-2.5">
          {itensFiltrados.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => setDetalhe(item)} />
          ))}
        </section>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => {
          setEditando(undefined);
          setFormAberto(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-brand px-5 py-4 font-semibold text-brand-fg shadow-xl active:scale-95 transition"
      >
        <span className="text-lg leading-none">+</span> Adicionar
      </button>

      {formAberto && (
        <ItemForm
          inicial={editando}
          onSalvar={handleSalvar}
          onCancelar={() => {
            setFormAberto(false);
            setEditando(undefined);
          }}
        />
      )}

      {detalhe && (
        <DetalheItem
          item={detalhe}
          onFechar={() => setDetalhe(null)}
          onEditar={() => {
            setEditando(detalhe);
            setDetalhe(null);
            setFormAberto(true);
          }}
          onRemover={() => handleRemover(detalhe.id)}
          onManutencao={() => registrarManutencao(detalhe)}
        />
      )}
    </main>
  );
}

function Stat({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted">{titulo}</p>
      <p className="text-lg font-bold mt-0.5 truncate">{valor}</p>
    </div>
  );
}

function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const status = statusGarantia(item);
  const meta = STATUS_META[status];
  const dias = diasRestantesGarantia(item);
  const cat = CATEGORIAS.find((c) => c.value === item.categoria);
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 text-left hover:border-brand transition"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-xl">
        {cat?.emoji ?? "📦"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">{item.nome}</p>
        <p className="text-sm text-muted truncate">
          {item.loja ? `${item.loja} · ` : ""}
          Comprado em {formatarData(new Date(item.dataCompra + "T00:00:00"))}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span
          className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ color: meta.cor, background: meta.bg }}
        >
          {status === "ativa" && dias !== null
            ? `${dias}d`
            : status === "vence-breve" && dias !== null
            ? `${dias}d`
            : status === "vencida"
            ? "vencida"
            : "—"}
        </span>
      </div>
    </button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">🧾</div>
      <h2 className="text-lg font-bold mb-2">Comece guardando sua primeira nota</h2>
      <p className="text-muted max-w-xs mx-auto mb-6">
        Cadastre um produto, tire foto da nota fiscal e o Vigio avisa você antes
        da garantia vencer.
      </p>
      <button
        onClick={onAdd}
        className="rounded-xl bg-brand px-6 py-3 font-semibold text-brand-fg"
      >
        + Adicionar primeiro item
      </button>
    </div>
  );
}

function DetalheItem({
  item,
  onFechar,
  onEditar,
  onRemover,
  onManutencao,
}: {
  item: Item;
  onFechar: () => void;
  onEditar: () => void;
  onRemover: () => void;
  onManutencao: () => void;
}) {
  const status = statusGarantia(item);
  const meta = STATUS_META[status];
  const venc = vencimentoGarantia(item);
  const prox = proximaManutencao(item);
  const cat = CATEGORIAS.find((c) => c.value === item.categoria);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={onFechar}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-surface-2 text-2xl">
            {cat?.emoji ?? "📦"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold leading-tight">{item.nome}</h2>
            <span
              className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ color: meta.cor, background: meta.bg }}
            >
              {meta.label}
            </span>
          </div>
        </div>

        {item.notaFoto && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.notaFoto}
            alt="Nota fiscal"
            className="w-full rounded-xl border border-border max-h-64 object-contain bg-surface-2 mb-4"
          />
        )}

        <dl className="space-y-2.5 text-[15px]">
          <Linha rotulo="Loja" valor={item.loja ?? "—"} />
          <Linha
            rotulo="Comprado em"
            valor={formatarData(new Date(item.dataCompra + "T00:00:00"))}
          />
          <Linha
            rotulo="Garantia até"
            valor={venc ? formatarData(venc) : "Sem garantia"}
          />
          <Linha
            rotulo="Valor"
            valor={item.valor ? formatarMoeda(item.valor) : "—"}
          />
          {prox && (
            <Linha rotulo="Próxima manutenção" valor={formatarData(prox)} />
          )}
          {item.obs && <Linha rotulo="Obs" valor={item.obs} />}
        </dl>

        <div className="mt-6 space-y-2">
          {item.manutencaoMeses ? (
            <button
              onClick={onManutencao}
              className="w-full rounded-xl bg-surface-2 border border-border py-3 font-medium"
            >
              🔧 Registrar manutenção feita hoje
            </button>
          ) : null}
          <div className="flex gap-2">
            <button
              onClick={onEditar}
              className="flex-1 rounded-xl bg-brand py-3 font-semibold text-brand-fg"
            >
              Editar
            </button>
            <button
              onClick={onRemover}
              className="rounded-xl border border-border px-4 py-3 font-medium"
              style={{ color: "var(--danger)" }}
            >
              Excluir
            </button>
          </div>
          <button
            onClick={onFechar}
            className="w-full py-2 text-muted text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <dt className="text-muted">{rotulo}</dt>
      <dd className="font-medium text-right">{valor}</dd>
    </div>
  );
}
