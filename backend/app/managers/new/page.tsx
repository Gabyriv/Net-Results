"use server"

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CreateManager from "../CreateManager";
import { Suspense } from "react";
import { Loader } from "@/components/loader";


export default async function NewManagerPage() {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect("/sign-in");
    }

    return (
    <>
        <Suspense fallback={<Loader title="Loading..." />}>
           <CreateManager />
         </Suspense>

    </>
  )
}
