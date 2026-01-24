// Internationalization translations
export const translations = {
  en: {
    dataManagement: {
      title: "Data Management",
      subtitle: "Export your data as backup or import previously saved data",
      summary: {
        incidents: "Incidents",
        observations: "Observations",
        inspections: "Inspections",
      },
      buttons: {
        export: "Export Data",
        exporting: "Exporting...",
        import: "Import Data",
        importing: "Importing...",
        clearAll: "Clear All Data",
        changeLanguage: "Français",
      },
      alerts: {
        invalidFormat: "Invalid backup file format",
        importSuccess: "Data imported successfully!",
        importError: "Error importing data: ",
        exportError: "Error exporting data. Please try again.",
        clearConfirm: "⚠️ This will permanently delete ALL local data (incidents, observations, inspections). This cannot be undone. Continue?",
        clearSuccess: "All data has been cleared!",
        info: "All data is stored locally in your browser. Export regularly to backup your data. You can store backups in Google Drive, OneDrive, Dropbox, or USB drive.",
      },
      importSummary: (incidents: number, observations: number, inspections: number) =>
        `Data imported successfully!\n\nIncidents: ${incidents}\nObservations: ${observations}\nInspections: ${inspections}`,
    },
  },
  fr: {
    dataManagement: {
      title: "Gestion des Données",
      subtitle: "Exportez vos données en tant que sauvegarde ou importez les données précédemment enregistrées",
      summary: {
        incidents: "Incidents",
        observations: "Observations",
        inspections: "Inspections",
      },
      buttons: {
        export: "Exporter les Données",
        exporting: "Export en cours...",
        import: "Importer les Données",
        importing: "Import en cours...",
        clearAll: "Effacer Toutes les Données",
        changeLanguage: "English",
      },
      alerts: {
        invalidFormat: "Format de fichier de sauvegarde invalide",
        importSuccess: "Données importées avec succès!",
        importError: "Erreur lors de l'importation des données: ",
        exportError: "Erreur lors de l'exportation des données. Veuillez réessayer.",
        clearConfirm: "⚠️ Ceci supprimera définitivement TOUTES les données locales (incidents, observations, inspections). Cette action ne peut pas être annulée. Continuer?",
        clearSuccess: "Toutes les données ont été effacées!",
        info: "Toutes les données sont stockées localement dans votre navigateur. Exportez régulièrement pour sauvegarder vos données. Vous pouvez stocker les sauvegardes sur Google Drive, OneDrive, Dropbox ou une clé USB.",
      },
      importSummary: (incidents: number, observations: number, inspections: number) =>
        `Données importées avec succès!\n\nIncidents: ${incidents}\nObservations: ${observations}\nInspections: ${inspections}`,
    },
  },
} as const

export type Language = "en" | "fr"
export type Translations = typeof translations

export const getTranslation = (lang: Language) => translations[lang]
