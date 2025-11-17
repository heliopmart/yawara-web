import Link from 'next/link';

import "@/styles/error.scss"

export default function AccountNotFound() {
  return (
    <main >
      <h2>Página Não Encontrada (404)</h2>
      <p>
        Ops! A página que você está procurando não existe ou está em desenvolvimento.
      </p>
      <Link href="/">Voltar para o inicio</Link>
    </main>
  );
}