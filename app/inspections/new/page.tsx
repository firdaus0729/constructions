"use client"

import dynamic from "next/dynamic"

const NewInspection = dynamic(() => import("./client"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
})

export default NewInspection
