# Plano: Atualizar logos do carrossel (Casas Bahia e IKEA)

## Contexto
O carrossel de logos na landing page (`src/pages/Index.tsx`, array `logos`, linhas 9–16) usa URLs do Wikimedia Commons. As URLs atuais do Casas Bahia e do IKEA estão quebradas.

## URLs novas fornecidas
- Casas Bahia: `https://upload.wikimedia.org/wikipedia/commons/c/c4/Casas_Bahia_logo_%282015%29.svg`
- IKEA: `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ikea_logo.svg/3840px-Ikea_logo.svg.png`

## O que será feito
1. Substituir no array `logos` de `src/pages/Index.tsx` as URLs antigas do Casas Bahia e IKEA pelas novas URLs.
2. Verificar no preview se as imagens carregam corretamente no carrossel.

## Escopo
Apenas a troca de duas URLs no componente de carrossel da landing page. Nenhuma outra alteração de código ou banco de dados.
