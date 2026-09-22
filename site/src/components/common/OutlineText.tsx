import { OutlineTextType } from '@/types/global'
import React from 'react'

const OutlineText = ({
  text,className
}:OutlineTextType) => {
  return (
    <div className={` text-tertiary border w-min text-nowrap text-lg leading-[22px] font-medium border-tertiary px-[30px] py-[9px] rounded-[50px] ${className}`} >

{
  text
}
    </div>
  )
}

export default OutlineText