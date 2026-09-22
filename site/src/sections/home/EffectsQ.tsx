import OutlineText from "@/components/common/OutlineText";
import EffectPoints from "@/components/homepage/EffectPoints";
import Image from "next/image";
import { title } from "process";
import React from "react";

const EffectsQ = () => {
   const features= [
    {
"title":"Your Personal Plant Guru, 24/7",
    "description": "Instantly get answers to all your pressing plant questions. Whether you're a seasoned gardener or just starting."
    },
    {
      "title": "Step-By-Step Growing Guides",
      "description": "Transform your space with thriving greenery. Simply tell Q what you want to grow, and it will provide a clear, easy-to-follow plan."
    },
    {
      "title": "Troubleshoot Plant Problems In An Instant",
      "description": "Concerned about a wilting leaf or mysterious spots? Describe the issue to Q, and receive a diagnosis and actionable solutions."
    },
    {
      "title": "Unlock The Secrets To A Greener Thumb",
      "description": "Go beyond basic care with personalized tips and tricks from Q. Learn how to optimize your plant's environment, understand its unique needs."
    },
    {
      "title": "Simplified Plant Care, Successful Results",
      "description": "Let Q take the guesswork out of gardening. With its vast knowledge base, Q simplifies the art and science of growing plants."
    }
  ]
 
  return (
    <div className="py-[100px] ">
      <div className="flex relative justify-center text-[60px] font-bold">
        What Are Q Do
        <div className="w-[320px] absolute bottom-0 h-[1px] bg-secondary " />
      </div>

      <div className="flex gap-[70px] justify-center mt-[70px] mx-auto">
        <div className="rounded-[20px]  overflow-hidden" > 
          <Image className='' src={'/images/Q.jpg'} alt="Q image"  width={800} height={800} />
        </div>

        <div className="flex flex-col my-auto gap-[50px]" >
          <OutlineText text="Effects of Q" />
          <div className="flex flex-col gap-[35px]" >
            {features?.map((item,index)=>(
              <EffectPoints key={index} title={item?.title} description={item?.description} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EffectsQ;
