import CustomButton from "@/components/common/CustomButton";
import OutlineText from "@/components/common/OutlineText";
import Image from "next/image";
import React from "react";

const AboutUs = () => {
  return (
    <div className="py-[100px] max-w-[1700px] flex flex-row gap-[50px]  w-full mx-auto">
      <div className="flex flex-row gap-5">
        <div className="rounded-[20px] h-min overflow-hidden">
          <Image
            src={"/images/oil.jpg"}
            alt=" cannabis"
            height={600}
            width={400}
          />
        </div>

        <div className="rounded-[20px] mt-[101px] overflow-hidden">
          <Image
            src={"/images/cannabis.jpg"}
            alt=" cannabis"
            height={600}
            width={400}
          />
        </div>
      </div>

      <div className="w-[1px]  bg-primary/50 " />
      <div className="max-w-[770px] my-auto w-full ">
        <OutlineText text="About Us" />

        <div className="leading-[73px] mt-[30px] text-primary font-bold text-[60px]">
          Marijuana Treats Many Health Issues
        </div>
        <p className=" text-primary/70 mt-5 text-[20px] leading-[30px]">
          Cusamus et iusto odio dignissimos ducimus qui blanditiis praesentium
          voluptatum deleniti atque corrupti quos dolores et quas molestias
          excepturi sint occaecati cupiditate non provident, similique similique
          sunt in culpa.
          <br/> Nam libero tempore, cum soluta nobis est eligendi
          optio, cumque nihil impedit,
          <br/>
           quo minus id, quod maxime placeat facere
          possimus, omnis voluptas assumenda 
          <br/>
          est, omnis dolor repellend[a]us.
          Temporibus autem quibusdam et aut officiis
          <br/>
           debitis aut rerum.
        </p>
        <CustomButton className="text-xl w-min mt-[40px] text-nowrap cursor-pointer text-white leading-6 font-medium px-[39px] py-[13px] uppercase !rounded-[50px] bg-secondary">
          Read More
        </CustomButton>
      </div>
    </div>
  );
};

export default AboutUs;
