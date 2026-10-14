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
  progressoGarantia,
  formatarData,
  formatarMoeda,
  StatusGarantia,
} from "./lib/warranty";
import ItemForm from "./components/ItemForm";

const STATUS_META: Record<
  StatusGarantia,
  { label: string; cor: string; soft: string }
> = {
  ativa: { label: "Garantia ativa", cor: "var(--ok)", soft: "var(--ok-soft)" },
  "vence-breve": { label: "Vence em breve", cor: "var(--warn)", soft: "var(--warn-soft)" },
  vencida: { label: "Garantia vencida", cor: "var(--danger)", soft: "var(--danger-soft)" },
  "sem-garantia": { label: "Sem garantia", cor: "var(--muted)", soft: "var(--surface-2)" },
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
        .filter(
          (i) =>
            statusGarantia(i) === "ativa" || statusGarantia(i) === "vence-breve"
        )
        .reduce((s, i) => s + (i.valor ?? 0), 0),
    [itens]
  );
  const garantiasAtivas = useMemo(
    () =>
      itens.filter(
        (i) =>
          statusGarantia(i) !== "vencida" && statusGarantia(i) !== "sem-garantia"
      ).length,
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
    <main className="mx-auto w-full max-w-2xl px-4 pb-32">
      {/* Header */}
      <header className="flex items-center justify-between pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="brand-gradient grid h-11 w-11 place-items-center rounded-2xl text-xl shadow-[var(--shadow-brand)]">
            👁️
          </div>
          <div>
            <h1 className="brand-text text-2xl font-black leading-none tracking-tight">
              Vigio
            </h1>
            <p className="text-[12px] text-muted mt-1 font-medium">
              garantias &amp; notas sob controle
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3 mb-6">
        <Stat icone="📦" titulo="Itens" valor={itens.length.toString()} />
        <Stat
          icone="🛡️"
          titulo="Garantias ok"
          valor={garantiasAtivas.toString()}
        />
        <Stat
          icone="💰"
          titulo="Protegido"
          valor={valorProtegido > 0 ? formatarMoeda(valorProtegido) : "—"}
        />
      </section>

      {/* Alertas */}
      {alertas.length > 0 && (
        <section className="mb-6 anim-fade-up">
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <span className="dot-pulse inline-block h-2 w-2 rounded-full bg-warn" />
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted">
              Precisa da sua atenção
            </h2>
          </div>
          <div className="space-y-2.5">
            {alertas.map((a, idx) => {
              const urgente = a.dias < 0;
              const cor = urgente ? "var(--danger)" : "var(--warn)";
              const soft = urgente ? "var(--danger-soft)" : "var(--warn-soft)";
              return (
                <button
                  key={idx}
                  onClick={() => setDetalhe(a.item)}
                  className="group w-full flex items-center gap-3.5 rounded-2xl border p-3.5 text-left shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)] active:scale-[0.99]"
                  style={{ borderColor: cor, background: soft }}
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
                    style={{ background: "var(--surface)", color: cor }}
                  >
                    {a.tipo === "garantia" ? "🛡️" : "🔧"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[15px] truncate text-foreground">
                      {a.titulo}
                    </p>
                    <p className="text-[13px]" style={{ color: cor }}>
                      {a.descricao}
                    </p>
                  </div>
                  <span
                    className="text-lg opacity-40 transition group-hover:translate-x-0.5"
                    style={{ color: cor }}
                  >
                    ›
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Busca */}
      {itens.length > 0 && (
        <div className="relative mb-4">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-2">
            🔍
          </span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto ou loja…"
            className="w-full rounded-2xl border border-border bg-surface pl-11 pr-4 py-3 text-[15px] shadow-[var(--shadow-sm)] outline-none transition focus:border-brand focus:ring-4 focus:ring-[var(--brand-soft)]"
          />
        </div>
      )}

      {/* Lista */}
      {carregando ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[72px] rounded-2xl border border-border bg-surface/60 animate-pulse"
            />
          ))}
        </div>
      ) : itens.length === 0 ? (
        <EmptyState onAdd={() => setFormAberto(true)} />
      ) : (
        <section className="space-y-2.5">
          {itensFiltrados.map((item, i) => (
            <div
              key={item.id}
              className="anim-fade-up"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <ItemCard item={item} onClick={() => setDetalhe(item)} />
            </div>
          ))}
          {itensFiltrados.length === 0 && (
            <p className="text-center text-muted py-10 text-sm">
              Nenhum item encontrado para “{busca}”.
            </p>
          )}
        </section>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => {
          setEditando(undefined);
          setFormAberto(true);
        }}
        className="brand-gradient fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl px-5 py-4 font-semibold text-brand-fg shadow-[var(--shadow-brand)] transition active:scale-95 hover:brightness-105"
      >
        <span className="text-xl leading-none -mt-0.5">+</span> Adicionar
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

function Stat({
  icone,
  titulo,
  valor,
}: {
  icone: string;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-2">
        <span className="text-sm">{icone}</span>
        {titulo}
      </div>
      <p className="text-[19px] font-bold mt-1.5 truncate leading-none">
        {valor}
      </p>
    </div>
  );
}

function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const status = statusGarantia(item);
  const meta = STATUS_META[status];
  const dias = diasRestantesGarantia(item);
  const prog = progressoGarantia(item);
  const cat = CATEGORIAS.find((c) => c.value === item.categoria);

  const badge =
    status === "vencida"
      ? "vencida"
      : dias !== null
      ? `${dias}d`
      : "—";

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-2xl border border-border bg-surface p-3.5 text-left shadow-[var(--shadow-sm)] transition hover:border-border-strong hover:bg-surface-hover hover:shadow-[var(--shadow-md)] active:scale-[0.995]"
    >
      <div className="flex items-center gap-3.5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-xl transition group-hover:scale-105">
          {cat?.emoji ?? "📦"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate leading-tight">{item.nome}</p>
          <p className="text-[13px] text-muted truncate mt-0.5">
            {item.loja ? `${item.loja} · ` : ""}
            {formatarData(new Date(item.dataCompra + "T00:00:00"))}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums"
          style={{ color: meta.cor, background: meta.soft }}
        >
          {badge}
        </span>
      </div>

      {/* Barra de progresso da garantia */}
      {prog !== null && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round(prog * 100)}%`,
              background: meta.cor,
            }}
          />
        </div>
      )}
    </button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-16 anim-fade-up">
      <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-brand-soft text-4xl shadow-[var(--shadow-sm)]">
        🧾
      </div>
      <h2 className="text-xl font-bold mb-2">
        Guarde sua primeira nota
      </h2>
      <p className="text-muted max-w-xs mx-auto mb-7 leading-relaxed">
        Cadastre um produto, tire foto da nota fiscal e o Vigio avisa você antes
        da garantia vencer.
      </p>
      <button
        onClick={onAdd}
        className="brand-gradient rounded-2xl px-6 py-3.5 font-semibold text-brand-fg shadow-[var(--shadow-brand)] transition active:scale-95 hover:brightness-105"
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
  const prog = progressoGarantia(item);
  const dias = diasRestantesGarantia(item);
  const cat = CATEGORIAS.find((c) => c.value === item.categoria);

  return (
    <div
      className="anim-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm"
      onClick={onFechar}
    >
      <div
        className="anim-sheet w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border border-border bg-surface p-5 sm:p-6 shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle mobile */}
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border-strong sm:hidden" />

        <div className="flex items-start gap-3.5 mb-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface-2 text-2xl">
            {cat?.emoji ?? "📦"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold leading-tight">{item.nome}</h2>
            <span
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ color: meta.cor, background: meta.soft }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: meta.cor }}
              />
              {meta.label}
              {dias !== null &&
                status !== "vencida" &&
                ` · ${dias} dia${dias === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        {/* Barra de progresso grande */}
        {prog !== null && (
          <div className="mb-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.round(prog * 100)}%`, background: meta.cor }}
              />
            </div>
          </div>
        )}

        {item.notaFoto && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.notaFoto}
            alt="Nota fiscal"
            className="w-full rounded-2xl border border-border max-h-64 object-contain bg-surface-2 mb-4"
          />
        )}

        <dl className="rounded-2xl border border-border bg-surface-2/50 divide-y divide-border overflow-hidden">
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

        <div className="mt-5 space-y-2.5">
          {item.manutencaoMeses ? (
            <button
              onClick={onManutencao}
              className="w-full rounded-2xl border border-border bg-surface-2 py-3 font-medium transition hover:bg-surface-hover active:scale-[0.99]"
            >
              🔧 Registrar manutenção feita hoje
            </button>
          ) : null}
          <div className="flex gap-2.5">
            <button
              onClick={onEditar}
              className="brand-gradient flex-1 rounded-2xl py-3 font-semibold text-brand-fg shadow-[var(--shadow-brand)] transition active:scale-[0.98] hover:brightness-105"
            >
              Editar
            </button>
            <button
              onClick={onRemover}
              className="rounded-2xl border px-5 py-3 font-medium transition active:scale-[0.98]"
              style={{ color: "var(--danger)", borderColor: "var(--danger-soft)" }}
            >
              Excluir
            </button>
          </div>
          <button
            onClick={onFechar}
            className="w-full py-2 text-muted text-sm transition hover:text-foreground"
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
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-muted text-[14px]">{rotulo}</dt>
      <dd className="font-medium text-right text-[14px]">{valor}</dd>
    </div>
  );
}
