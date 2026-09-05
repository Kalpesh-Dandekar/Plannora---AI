import type { Metadata } from "next";
import { PlannerSetup } from "@/components/planner/planner-setup";
export const metadata: Metadata = { title: "Create your plan — Plannora" };
export default function PlannerPage(){return <PlannerSetup/>}
