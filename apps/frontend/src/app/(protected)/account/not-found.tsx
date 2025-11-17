import Link from 'next/link';

import "@/styles/error.scss"

export default function AccountNotFound() {
  return (
    <main >
      <h2>Página Não Encontrada (404)</h2>
      <p>
        Ah não! Essa pagina não está disponível no momento. Talvez ela esteja em construção ou você tenha digitado o endereço errado.
      </p>
      <Link href="/account">Voltar para o inicio</Link>
    </main>
  );
}