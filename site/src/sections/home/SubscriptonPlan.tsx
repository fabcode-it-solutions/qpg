import PricePlanCard from "@/components/homepage/PricePlanCard";
import Image from "next/image";
import React from "react";

const SubscriptonPlan = () => {
  const plans = [
    {
      duration: "1 Months",
      price: 149,
      heading: "Included in the infinity Pack",
      features: [
        "Lorem Ipsum is simply dummy text",
        "Lorem Ipsum is simply dummy text",
        "Lorem Ipsum is simply dummy text",
        "Lorem Ipsum is simply dummy text",
        "Lorem Ipsum is simply dummy text",
      ],
    },
        {
      duration: "2 Months",
      price: 199,
      heading: "Included in the infinity Pack",
      features: [
        "Lorem Ipsum is simply dummy text",
        "Lorem Ipsum is simply dummy text",
        "Lorem Ipsum is simply dummy text",
        "Lorem Ipsum is simply dummy text",
        "Lorem Ipsum is simply dummy text",
      ],
    },
      {
      duration: "3 Months",
      price: 299,
      heading: "Included in the infinity Pack",
      features: [
        "Lorem Ipsum is simply dummy text",
        "Lorem Ipsum is simply dummy text",
        "Lorem Ipsum is simply dummy text",
        "Lorem Ipsum is simply dummy text",
        "Lorem Ipsum is simply dummy text",
      ],
    },
  ];

  return (
    <div className="w-full relative min-h-[700px] pt-[53px] pb-[74px] overflow-hidden flex flex-col justify-start items-center mx-auto px-4">
      <div className="text-[60px] z-10 text-white leading-[73px] font-bold flex justify-center">
        Subscription Plan
      </div>
      <div className="absolute inset-0">
        <div className="absolute inset-0 w-full h-full bg-[#1E7A37] opacity-95 z-0"></div>
        <Image
          src={"/images/our-home/backgroundImage.jpg"}
          width={1920}
          height={700}
          alt="background image"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex z-10  mt-[50px] gap-[50px]">
        {
            plans?.map((item,index)=>(
                <PricePlanCard duration={item.duration} key={index} features={item.features} heading={item.heading} price={item.price}/>

            ))
        }
      </div>
    </div>
  );
};

export default SubscriptonPlan;
