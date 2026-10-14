# 👁️ Vigio

**Suas garantias e notas fiscais sob controle.** Guarde a nota, acompanhe a
garantia e receba um alerta antes de vencer — nunca mais perca dinheiro por
desorganização.

## O problema (a dor)

Todo mundo já comprou algo que quebrou dentro da garantia e não achou a nota
fiscal. Ou esqueceu a revisão do carro / a troca do filtro. O Vigio resolve isso.

## O que o MVP já faz

- 📸 Cadastrar produto com **foto da nota fiscal** (redimensionada automaticamente)
- 🛡️ **Cálculo automático** do vencimento da garantia
- ⚠️ **Painel de alertas**: avisa quando a garantia está a ≤ 30 dias de vencer (ou já venceu)
- 🔧 **Manutenção recorrente** opcional (óleo, filtro, revisão) com lembrete e botão "feita hoje"
- 💰 Visão de **valor protegido** e quantidade de garantias ativas
- 🔎 Busca por produto/loja, categorias, detalhe do item
- 📱 Interface **mobile-first** com tema claro/escuro automático

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- Dados no próprio navegador via **IndexedDB** (`app/lib/db.ts`) — sem login, sem servidor

## Rodar

```bash
npm install
npm run dev
# abre http://localhost:3000
```

## Estrutura

```
app/
  lib/
    types.ts       # modelo de dados (Item, categorias)
    warranty.ts    # lógica de garantia, status e geração de alertas
    db.ts          # persistência em IndexedDB
  components/
    ItemForm.tsx   # formulário de cadastro/edição + captura de foto
  page.tsx         # tela principal (dashboard, alertas, lista, detalhe)
```

## Roadmap (próximas fases)

**Fase 2 — tornar útil de verdade**
- [ ] **OCR da nota** (ler produto/data/valor da foto automaticamente)
- [ ] **Notificações** reais (push/web) e alerta por e-mail/WhatsApp
- [ ] Exportar/importar dados (backup)

**Fase 3 — virar produto (nuvem + conta)**
- [ ] Conta de usuário + sincronização entre aparelhos (ex: Supabase)
- [ ] Plano Premium: itens ilimitados, OCR, alerta por WhatsApp
- [ ] PWA instalável no celular

## Validação (antes de investir pesado)

1. Falar com 10 pessoas que já perderam garantia — a dor é real pra elas?
2. Colocar o MVP na mão de 5 pessoas e ver se cadastram itens sozinhas.
3. Medir: elas voltam quando recebem um alerta? Esse é o sinal de que funciona.
