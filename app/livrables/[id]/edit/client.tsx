"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { FormHeader } from "@/components/forms/form-header"
import { useLocale } from "@/lib/locale-context"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

export default function EditLivrablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t } = useLocale()
  const { livrables } = useAppStore()

  const livrable = livrables.find((s) => s.id === id)

  if (!livrable) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">{t("empty.notFound.livrable")}</p>
        </div>
      </AppShell>
    )
  }

  // For now, redirect to view page - full edit implementation can be added later
  return (
    <AppShell>
      <FormHeader title={t("livrable.title")} backHref={`/livrables/${id}`} />
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Edit functionality coming soon</p>
          <Button onClick={() => router.push(`/livrables/${id}`)}>
            {t("action.back")}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
