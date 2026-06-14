import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Blog | Neon Bright",
  description: "Insights on LED neon signage, design trends, and commercial lighting.",
};

export default function BlogHubPage() {
  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <Container>
          <h1 className="font-display text-3xl font-bold">Blog</h1>
          <p className="mt-3 max-w-xl text-white/55">
            Articles coming soon. CMS-managed blog posts will appear here.
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
