"use client"

import dynamic from "next/dynamic"

const EditInspection = dynamic(() => import("./client"), { ssr: false, loading: () => <div>Loading...</div> })

export default EditInspection
