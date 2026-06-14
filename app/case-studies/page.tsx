import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Case Studies | Neon Bright",
  description: "Real neon sign projects delivered across Morocco.",
};

export default function CaseStudiesHubPage() {
  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <Container>
          <h1 className="font-display text-3xl font-bold">Case Studies</h1>
          <p className="mt-3 max-w-xl text-white/55">
            Project showcases coming soon. CMS-managed case studies will appear here.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-neon-pink hover:underline">
            ← Back to Home
          </Link>
        </Container>
      </main>
      <Footer />
    </>
  );
}
