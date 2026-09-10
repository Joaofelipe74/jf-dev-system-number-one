# Pasta de imagens da marca JF Dev

Esta pasta é reservada para a(s) imagem(ns) oficial(is) da JF Dev (por
exemplo, logotipo em PNG/SVG, ou uma imagem de identidade a ser usada no
rodapé/seção de contato do site).

Nenhuma fotografia ou imagem de marca foi inventada neste projeto — o
restante da experiência visual foi construído inteiramente com CSS, SVG,
gradientes e composições 3D para não depender de bancos de imagem externos.

## Como usar

1. Coloque o arquivo aqui, por exemplo: `public/images/jf-dev/logo.svg` ou
   `public/images/jf-dev/marca.png`.
2. Referencie a partir do código com o caminho absoluto a partir de
   `public/`, por exemplo:

   ```tsx
   <img src="/images/jf-dev/logo.svg" alt="JF Dev" />
   ```

3. Se preferir usar o componente otimizado do Next.js:

   ```tsx
   import Image from 'next/image';
   <Image src="/images/jf-dev/logo.svg" alt="JF Dev" width={140} height={40} />
   ```

Formatos recomendados: SVG (preferencial, escala perfeitamente) ou PNG com
fundo transparente.
