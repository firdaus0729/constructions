"use client"

import dynamic from "next/dynamic"

const EditIncident = dynamic(() => import("./client"), { ssr: false, loading: () => <div>Loading...</div> })

export default EditIncident
