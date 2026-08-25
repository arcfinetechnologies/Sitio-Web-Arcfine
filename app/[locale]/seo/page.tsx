import type { Metadata } from "next";
import SeoHero from "@/components/seo/SeoHero";
import SeoComoFunciona from "@/components/seo/SeoComoFunciona";
import SeoProceso from "@/components/seo/SeoProceso";
import SeoAuditoria from "@/components/seo/SeoAuditoria";
import SeoResultados from "@/components/seo/SeoResultados";
import Contacto from "@/components/Contacto";
import ClickSpark from "@/components/ClickSpark";
import { setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "SEO y posicionamiento — arcfine",
  description:
    "Auditoría SEO completa: análisis de tráfico, demanda y competencia, arquitectura y catorce bloques de revisión técnica. Con plazos reales, no prometidos.",
};

export default async function SeoPage({ params }: { params: Promise<{ locale: string }> }) {
  // Mantiene la página PRERENDERIZADA (ver la nota larga en el layout).
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    // Mismo remate interactivo que /desarrollo-web: chispas lima al click,
    // sin wrapper que afecte a los pins.
    <ClickSpark sparkColor="#A8F04A" sparkSize={11} sparkRadius={22} sparkCount={8} duration={480}>
      {/* El orden cuenta una historia y no es intercambiable: el hero vende el
          resultado, "cómo funciona" pone las expectativas en su sitio antes de
          seguir vendiendo, el proceso explica cómo se llega, la auditoría
          enseña la profundidad real del trabajo y los resultados cierran con la
          prueba. Poner las expectativas al final las convertiría en letra
          pequeña, que es exactamente lo contrario de para lo que están. */}
      <SeoHero />
      <SeoComoFunciona />
      <SeoProceso />
      <SeoAuditoria />
      <SeoResultados />
      <Contacto />
    </ClickSpark>
  );
}
