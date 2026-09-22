import Image from "next/image";
import React from "react";
import CustomButton from "../common/CustomButton";
import { PricePlanCardType } from "@/types/global";

const PricePlanCard = ({
  duration,
  price,
  heading,
  features,
}: PricePlanCardType) => {
  return (
    <div className="flex bg-white font-[inter] min-w-[450px] min-h-[600px] pt-[47px] pb-[41px] px-[31px] rounded-[20px] flex-col ">
      <div className="flex justify-center text-[40px] font-bold leading-[48px]" >{duration}</div>
      <div className="flex justify-center text-[80px]  font-[900] text-tertiary relative ">${price}
        <div className="absolute bg-tertiary bottom-0 w-[180px] h-[2px]" />
      </div>
      <div className="flex justify-center mt-[40px] font-bold text-[20px] ">{heading}</div>
      <div className="mt-[23px] flex flex-col gap-[25px]" >
        {
            features?.map((item,index)=>(
                <div className="flex items-center   gap-[15px]" key={index}>
        <div className="w-[20px] flex justify-center h-[20px]">
              <Image
            src={"/images/our-home/tickIcon.png"}
            alt="Tick Icon"
            className="object-cover w-full h-full "
            width={20}
            height={20}
          />
            </div>
          <div className="font-medium text-[20px]">{item}</div>
        </div>
            ))
        }
      </div>
      <CustomButton className="bg-tertiary mt-[50px] cursor-pointer !w-min !rounded-[50px] mx-auto text-white px-[50px] py-[13px] text-[20px] font-medium" >Select</CustomButton>
    </div>
  );
};

export default PricePlanCard;
