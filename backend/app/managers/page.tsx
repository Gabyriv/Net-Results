"use server"

import { prisma } from "@/lib/prisma"
import { Suspense } from "react"
import CreateManager from "./CreateManager"
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Loader } from "@/components/loader";

export default async function ManagerPage() {

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect("/sign-in");
    }

    const manager = await prisma.manager.findUnique({where: {userId: user.id}})

    const player = await prisma.player.findUnique({where: {userId: user.id}})

    if (player)
        { redirect("/players") }

    if (!manager)
        { redirect("/managers/new") }


    // manager page to create teams and players
return (
    <>
      <Suspense fallback={<Loader title="Loading..." />}>
        {/* <ViewTeams />
        <ViewPlayers />
        <CreateTeams/>
        <CreatePlayers/> */}
      </Suspense>
    </>
)



    
}