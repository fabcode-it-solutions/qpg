import { EffectPointsType } from "@/types/global";
import Image from "next/image";
import React from "react";

const EffectPoints = ({ title, description }:EffectPointsType) => {
  return (
    <div className="flex gap-5 ">
      <div>
        <Image src={'/images/checkBoxIcon.png'} width={40} height={40} alt="Check box Icon" />
      </div>

      <div className="flex flex-col  gap-[5px] max-w-[710px] w-full">
        <div className="text-2xl font-bold font-[Inter]" >{title}</div>
        <div className="text-[#00172FB2] text-[20px]" >{description}</div>
      </div>
    </div>
  );
};

export default EffectPoints;
