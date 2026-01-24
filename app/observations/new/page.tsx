"use client"

import dynamic from "next/dynamic"

const NewObservation = dynamic(() => import("./client"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
})

export default NewObservation
