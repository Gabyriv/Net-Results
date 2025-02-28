import { createClient } from '@/utils/supabase/client';
import AccountForm from './account-form';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

//rsc react server component

export default async function Account() {
    const supabase = createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()



    if (!user) {
        return  redirect('/sign-in')
    }



    return (
    <Suspense fallback={<div>Loading...</div>}>
        <AccountForm user={user} />
    </Suspense>
    )
}