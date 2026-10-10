"use client";

import { useEffect } from "react";
import { initInteractions } from "@/lib/interactions";

export default function Interactions() {
  useEffect(() => initInteractions(), []);
  return null;
}
