import { FeaturedCardType } from "@/types/global";
import Image from "next/image";
import React from "react";

const FeaturedCard = ({ imgSrc, number, description }: FeaturedCardType) => {
  return (
    <div className="flex flex-col font-[inter] pt-[39px] pb-[43px] max-w-[478px] gap-[25px]">
      <div className="rounded-full bg-white mx-auto  p-[35px] flex w-min" >
        <div className="h-[70px] w-[70px]   ">
          <Image
            src={imgSrc}
            alt="Featured Icon"
            className="w-full h-full"
            height={70}
            width={70}
          />
        </div>
      </div>

      <div className="font-[900] flex text-[60px] text-white justify-center">{number}</div>
      <div className="font-medium max-w-[366px] mx-auto flex text-white justify-center text-[28px] text-center">
        {description}
      </div>
    </div>
  );
};

export default FeaturedCard;
