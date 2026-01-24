"use client"

import { useState, useRef, useEffect } from "react"
import { Download, Upload, Trash2, AlertTriangle, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAppStore } from "@/lib/store"
import { getTranslation, type Language } from "@/lib/i18n"
import { useLocale } from "@/lib/locale-context"

export function DataManagement() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const { locale, setLocale } = useLocale()
  const [language, setLanguage] = useState<Language>(locale)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { incidents, observations, inspections, addIncident, addObservation, addInspection } = useAppStore()
  const t = getTranslation(language).dataManagement
  useEffect(() => {
    setLanguage(locale)
  }, [locale])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = {
        incidents,
        observations,
        inspections,
        exportDate: new Date().toISOString(),
        version: "1.0",
        stats: {
          totalIncidents: incidents.length,
          totalObservations: observations.length,
          totalInspections: inspections.length,
        },
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `construction-forms-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export error:", error)
      alert(t.alerts.exportError)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Validate structure
      if (!data.incidents || !data.observations || !data.inspections) {
        throw new Error(t.alerts.invalidFormat)
      }

      // Import incidents
      let incidentCount = 0
      for (const incident of data.incidents) {
        try {
          addIncident(incident)
          incidentCount++
        } catch (e) {
          console.warn("Error importing incident:", e)
        }
      }

      // Import observations
      let observationCount = 0
      for (const observation of data.observations) {
        try {
          addObservation(observation)
          observationCount++
        } catch (e) {
          console.warn("Error importing observation:", e)
        }
      }

      // Import inspections
      let inspectionCount = 0
      for (const inspection of data.inspections) {
        try {
          addInspection(inspection)
          inspectionCount++
        } catch (e) {
          console.warn("Error importing inspection:", e)
        }
      }

      const alertMessage = typeof t.alerts === 'object' && 'importSummary' in t.alerts && typeof t.alerts.importSummary === 'function'
        ? t.alerts.importSummary(incidentCount, observationCount, inspectionCount)
        : `Data imported successfully!\n\nIncidents: ${incidentCount}\nObservations: ${observationCount}\nInspections: ${inspectionCount}`
      alert(alertMessage)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      alert(t.alerts.importError + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsImporting(false)
    }
  }

  const handleClearData = () => {
    if (window.confirm(t.alerts.clearConfirm)) {
      // Clear all data by resetting store
      const state = useAppStore.getState()
      
      // Delete all incidents
      for (const incident of state.incidents) {
        state.deleteIncident(incident.id)
      }
      
      // Delete all observations
      for (const observation of state.observations) {
        state.deleteObservation(observation.id)
      }
      
      // Delete all inspections
      for (const inspection of state.inspections) {
        state.deleteInspection(inspection.id)
      }

      alert(t.alerts.clearSuccess)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t.title}
            </CardTitle>
            <CardDescription>
              {t.subtitle}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocale(language === "fr" ? "en" : "fr")}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            {getTranslation(language).dataManagement.buttons.changeLanguage}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Data Summary */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-white dark:bg-slate-900 rounded-lg">
          <div>
            <div className="text-xs text-muted-foreground">{t.summary.incidents}</div>
            <div className="text-2xl font-bold">{incidents.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t.summary.observations}</div>
            <div className="text-2xl font-bold">{observations.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t.summary.inspections}</div>
            <div className="text-2xl font-bold">{inspections.length}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || (incidents.length === 0 && observations.length === 0 && inspections.length === 0)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? t.buttons.exporting : t.buttons.export}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            disabled={isImporting}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? t.buttons.importing : t.buttons.import}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
            disabled={isImporting}
          />

          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearData}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t.buttons.clearAll}
          </Button>
        </div>

        {/* Info Alert */}
        <Alert className="border-blue-300 bg-blue-100 dark:bg-blue-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {t.alerts.info}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
