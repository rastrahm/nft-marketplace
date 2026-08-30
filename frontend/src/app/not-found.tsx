import Link from "next/link";

/**
 * Página 404.
 * @returns {JSX.Element}
 */
export default function NotFoundPage() {
  return (
    <section className="panel">
      <h2 className="panel-title">No encontrado</h2>
      <p className="muted">Esa ruta no existe en la demo.</p>
      <Link href="/" className="btn btn-primary">
        Volver al marketplace
      </Link>
    </section>
  );
}
