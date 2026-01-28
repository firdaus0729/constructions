"use client"

import dynamic from "next/dynamic"

const NewLivrable = dynamic(() => import("./client"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
})

export default NewLivrable
