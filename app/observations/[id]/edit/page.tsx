"use client"

import dynamic from "next/dynamic"

const EditObservation = dynamic(() => import("./client"), { ssr: false, loading: () => <div>Loading...</div> })

export default EditObservation
