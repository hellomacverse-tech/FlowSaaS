import Link from "next/link";
import { Accordion } from "@/components/ui/Accordion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { homeFaqs } from "@/data/faqs";

export function FaqSection() {
  const items = homeFaqs.map((faq) => ({ id: faq.id, question: faq.question, answer: faq.answerPlain }));

  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="faq-heading" className="text-h2 text-ink">
              Frequently Asked Questions
            </h2>
            <Card className="mt-6 p-5">
              <p className="text-sm font-semibold text-ink">Still stuck?</p>
              <p className="mt-1.5 text-sm text-ink-2">
                Talk to a human about your specific setup, servers, or Meta app.
              </p>
              <Button asChild size="sm" variant="secondary-outline" className="mt-4">
                <Link href="/services#book">Talk to a human</Link>
              </Button>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Accordion items={items} defaultOpenId={items[0]?.id} />
          </div>
        </div>
      </div>
    </section>
  );
}
