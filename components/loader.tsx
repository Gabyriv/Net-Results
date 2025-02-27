import { LoaderIcon } from 'lucide-react'
import React from 'react'

export const Loader = ({title}: {title: string}) => {
  return (
    <div className='flex flex-col gap-4 items-center'>
    <LoaderIcon className='h-4 w-4 animate-spin' />
    <>{title}</>
    </div>
  )
}
