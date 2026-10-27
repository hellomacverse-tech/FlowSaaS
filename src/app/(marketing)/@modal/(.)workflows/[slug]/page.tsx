"use client";

import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { use } from "react";
import { Modal } from "@/components/ui/Modal";
import { QuickViewContent } from "@/components/catalog/QuickViewContent";
import { getWorkflowDetail } from "@/data/workflow-details";

export default function QuickViewModal({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { slug } = use(params);
  const workflow = getWorkflowDetail(slug);

  if (!workflow) {
    notFound();
  }

  return (
    <Modal title={`Quick view — ${workflow.title}`} onClose={() => router.back()}>
      <QuickViewContent workflow={workflow} />
    </Modal>
  );
}
