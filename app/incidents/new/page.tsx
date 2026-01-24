"use client"

import dynamic from "next/dynamic"

const NewIncident = dynamic(() => import("./client"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
})

export default NewIncident
