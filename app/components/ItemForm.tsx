"use client";

import { useState } from "react";
import { CATEGORIAS, Categoria, Item, ItemInput } from "../lib/types";

async function arquivoParaDataUrl(file: File, maxLado = 1400): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.8);
}

interface Props {
  inicial?: Item;
  onSalvar: (input: ItemInput, id?: string) => void;
  onCancelar: () => void;
}

export default function ItemForm({ inicial, onSalvar, onCancelar }: Props) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [categoria, setCategoria] = useState<Categoria>(
    inicial?.categoria ?? "eletronico"
  );
  const [loja, setLoja] = useState(inicial?.loja ?? "");
  const [dataCompra, setDataCompra] = useState(
    inicial?.dataCompra ?? new Date().toISOString().slice(0, 10)
  );
  const [garantiaMeses, setGarantiaMeses] = useState(
    inicial?.garantiaMeses?.toString() ?? "12"
  );
  const [valor, setValor] = useState(inicial?.valor?.toString() ?? "");
  const [notaFoto, setNotaFoto] = useState(inicial?.notaFoto ?? "");
  const [manutencaoMeses, setManutencaoMeses] = useState(
    inicial?.manutencaoMeses?.toString() ?? ""
  );
  const [obs, setObs] = useState(inicial?.obs ?? "");
  const [processandoFoto, setProcessandoFoto] = useState(false);

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessandoFoto(true);
    try {
      setNotaFoto(await arquivoParaDataUrl(file));
    } catch {
      alert("Não consegui processar essa imagem. Tente outra.");
    } finally {
      setProcessandoFoto(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    const input: ItemInput = {
      nome: nome.trim(),
      categoria,
      loja: loja.trim() || undefined,
      dataCompra,
      garantiaMeses: Number(garantiaMeses) || 0,
      valor: valor ? Number(valor) : undefined,
      notaFoto: notaFoto || undefined,
      manutencaoMeses: manutencaoMeses ? Number(manutencaoMeses) : undefined,
      ultimaManutencao: inicial?.ultimaManutencao,
      obs: obs.trim() || undefined,
    };
    onSalvar(input, inicial?.id);
  }

  const campo =
    "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-[15px] outline-none transition focus:border-brand focus:ring-4 focus:ring-[var(--brand-soft)]";
  const label = "block text-sm font-medium mb-1.5 text-muted";

  return (
    <div className="anim-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="anim-sheet w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border border-border bg-surface p-5 sm:p-6 shadow-[var(--shadow-lg)]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border-strong sm:hidden" />
        <h2 className="text-xl font-bold mb-5">
          {inicial ? "Editar item" : "Novo item"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className={label}>Nome do produto *</label>
            <input
              className={campo}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Geladeira Brastemp Frost Free"
              autoFocus
            />
          </div>

          <div>
            <label className={label}>Categoria</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIAS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setCategoria(c.value)}
                  className={`rounded-xl border px-2 py-2.5 text-sm transition active:scale-95 ${
                    categoria === c.value
                      ? "brand-gradient border-transparent text-brand-fg font-semibold shadow-[var(--shadow-brand)]"
                      : "border-border bg-surface-2 text-muted hover:border-border-strong"
                  }`}
                >
                  <span className="mr-1">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Data da compra</label>
              <input
                type="date"
                className={campo}
                value={dataCompra}
                onChange={(e) => setDataCompra(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Garantia (meses)</label>
              <input
                type="number"
                min={0}
                className={campo}
                value={garantiaMeses}
                onChange={(e) => setGarantiaMeses(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Loja (opcional)</label>
              <input
                className={campo}
                value={loja}
                onChange={(e) => setLoja(e.target.value)}
                placeholder="Magazine Luiza"
              />
            </div>
            <div>
              <label className={label}>Valor (opcional)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className={campo}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="R$"
              />
            </div>
          </div>

          <div>
            <label className={label}>
              Manutenção a cada (meses) — opcional
            </label>
            <input
              type="number"
              min={0}
              className={campo}
              value={manutencaoMeses}
              onChange={(e) => setManutencaoMeses(e.target.value)}
              placeholder="Ex: 6 (troca de óleo, filtro, revisão)"
            />
          </div>

          <div>
            <label className={label}>Foto da nota fiscal</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFoto}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-brand file:font-semibold file:cursor-pointer"
            />
            {processandoFoto && (
              <p className="text-sm text-muted mt-2">Processando imagem…</p>
            )}
            {notaFoto && (
              <div className="mt-3 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={notaFoto}
                  alt="Nota fiscal"
                  className="rounded-xl border border-border max-h-48 object-contain w-full bg-surface-2"
                />
                <button
                  type="button"
                  onClick={() => setNotaFoto("")}
                  className="absolute top-2 right-2 rounded-lg bg-black/60 text-white text-xs px-2 py-1"
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          <div>
            <label className={label}>Observações (opcional)</label>
            <textarea
              className={campo}
              rows={2}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Nº de série, local da nota física, etc."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 rounded-2xl border border-border py-3 font-medium text-muted transition hover:bg-surface-2 active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="brand-gradient flex-1 rounded-2xl py-3 font-semibold text-brand-fg shadow-[var(--shadow-brand)] transition active:scale-[0.98] hover:brightness-105"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
