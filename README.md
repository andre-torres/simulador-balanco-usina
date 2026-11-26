# Balanço de Usina — simulador de processo

Aplicação web para simular o balanço de uma usina de açúcar e etanol: você digita os
dados primários (moagem, cana, caldo, eficiências) e recebe a produção de açúcar e
etanol e o tamanho necessário dos equipamentos de aquecimento (antes e depois do
decantador), evaporação e cozimento, comparado com o instalado.

O cálculo é o porte da planilha **Simulação Processo v2.2 (corrigida)**.

## Stack

- React 19, TypeScript, Vite, React Router 7 (modo biblioteca, `createBrowserRouter`)
- Tailwind CSS v4 com `@tailwindcss/vite`
- shadcn/ui estilo new-york (Radix UI + Lucide React) em `src/components/ui`
- Supabase: autenticação e PostgreSQL (Storage ainda sem uso)
- Vitest para os testes do motor de cálculo

Não há nada de Next.js: é uma SPA React + Vite.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

Sem configurar o Supabase o app abre em **modo demonstração**: não pede login e
guarda as simulações no `localStorage` do navegador. Serve para avaliar o cálculo e
as telas.

### Ligar o Supabase

1. Crie um projeto em supabase.com.
2. No SQL Editor, rode `supabase/migrations/0001_simulacoes.sql` (cria a tabela
   `simulacoes` com RLS: cada usuário só enxerga as próprias).
3. Copie `.env.example` para `.env.local` e preencha a URL e a chave pública
   (Project Settings → API).
4. Reinicie `npm run dev`. O app passa a exigir login (`/login`, `/cadastro`).

Por padrão o Supabase pede confirmação de e-mail no cadastro; a tela de cadastro já
trata os dois casos (com e sem confirmação).

### Outros comandos

```bash
npm test           # motor × planilha (153 testes)
npm run typecheck
npm run lint
npm run build      # gera dist/
```

Na hospedagem, configure o redirecionamento de todas as rotas para `index.html`
(SPA fallback), senão um link direto como `/simulacoes/<id>/evaporacao` devolve 404.

## Estrutura

```
src/
  engine/                 motor de cálculo — TypeScript puro, sem React
    tipos.ts              Entradas e Resultado
    padroes.ts            cenário inicial e premissas (valores da planilha v2.2)
    calcular.ts           balanço, extração, aquecimento, evaporação, cozimento, capacidade
    limite.ts             trava automática da moagem
    calcular.test.ts      compara com os valores da planilha
    __fixtures__/         valores calculados pelo Excel, extraídos da planilha
  features/
    auth/                 sessão Supabase e proteção de rotas
    simulacoes/           repositório (Supabase ou navegador)
    simulador/            estado da simulação aberta, gravação automática
  pages/
    acesso.tsx            login e cadastro
    simulacoes.tsx        lista, nova, duplicar, excluir
    simulador/            dados primários, produção, aquecimento, evaporação,
                          cozimento, extração e destilaria, capacidade, premissas
  components/ui/          componentes shadcn (new-york)
supabase/migrations/      SQL da tabela e das políticas
```

A tela nunca calcula: ela chama `calcular(entradas)` e mostra o `Resultado`. O motor
não depende do navegador, então pode ir para uma Edge Function do Supabase sem
reescrita — passo necessário antes de vender por assinatura, porque hoje as
fórmulas vão no JavaScript entregue ao navegador.

O arquivo `components.json` já está configurado; com acesso ao registro do shadcn dá
para adicionar componentes com `npx shadcn@latest add <componente>`.

## Conferência com a planilha

`npm test` roda o cenário padrão e compara 146 resultados com as células da
planilha (tolerância relativa de 1e-9), mais a ocupação dos 23 equipamentos da aba
Capacidade. Cada linha do teste traz a célula de origem, e `calcular.ts` cita a
célula ao lado de cada fórmula, por exemplo `[BM AF34]` = Balanço de massa!AF34.

Abas portadas: Balanço de massa, Difusor, Trat caldo, Evaporação, Cálculo 1,
Cozimento, Destilação (consumo de vapor), Capacidade, Premissas, Equipamentos.

Fora desta versão: Geração de Vapor e Energia, Mosto e a aba oculta Vácuos (que
contribui com zero para as sangrias no cenário da planilha).

## Pontos mantidos iguais à planilha, para decisão

1. **Velocidade nos aquecedores da Fase 2.** A planilha usa a vazão da Fase 1
   (`Trat caldo!AH19` aponta para `$H$5`). Com a vazão da própria Fase 2 a velocidade
   cai de 0,93 para 0,83 m/s e a área necessária da Fase 2 sobe cerca de 10%.
   Está marcado como `DECISÃO PENDENTE` em `calcular.ts`.
2. **Vapor da coluna C.** Na planilha a coluna C está desligada (`Destilação!AA36 = 2`),
   então digitar anidro não gera consumo de vapor. O app começa igual; a chave fica
   na tela Extração e destilaria.
3. **Vazão de mel A na massa B.** `Cozimento!R44` divide pelo Brix do mel final, não
   pelo do mel A. O valor é calculado pelo motor mas não aparece nas telas.

## Diferenças deliberadas em relação à planilha

- **Trava da moagem.** A planilha estima a moagem máxima como moagem ÷ ocupação e
  pede para digitar o valor. Só baixar a moagem não alivia a fábrica de açúcar,
  porque a carga dela vem do caldo para açúcar, que é uma entrada. O botão da tela
  Capacidade reduz moagem e caldo para açúcar na mesma proporção e procura, com o
  próprio motor, a maior moagem em que nenhum equipamento dos setores ligados passa
  de 100%.
- **Entrada dos aquecedores.** Campo vazio = saída do aquecedor anterior. O cenário
  padrão reproduz a planilha, inclusive as entradas digitadas dos aquecedores 3 e 4
  da Fase 1.
- **Eficiências em %.** A planilha guarda frações (0,956); o app mostra 95,6%.
- **Valores extras:** produção na safra (produção diária × dias de safra), etanol de
  milho por dia e área necessária de cada efeito (evaporação ÷ taxa máxima).

## Antes de publicar

O cenário inicial (`src/engine/padroes.ts`) repete os valores da planilha v2.2, que é
o que o teste confere. Para o produto, troque por valores de exemplo genéricos; o
teste continua valendo se o cenário da planilha for mantido só dentro do arquivo de
teste.
