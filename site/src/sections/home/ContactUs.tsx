 import CustomButton from "@/components/common/CustomButton";
import Image from "next/image";
import React from "react";

const ContactUs = () => {
  return (
    <div className=" flex flex-col font-[inter] mt-[60px] mb-[100px]  ">
      <div className="h-[70px] mx-auto w-[70px] ">
        <Image
          alt="contact-us icon"
          src={"/images/featured/4.png"}
          height={70}
          width={70}
          className="w-full object-cover h-full"
        />
      </div>
      <div  className="mx-auto font-bold  text-[60px] leading-[73px] mt-[10px]"> Subscribe</div>
      <div className="text-primary/70 text-lg mx-auto mt-5 leading-[27px] "  > Delivered to your inbox along with special discounts</div>

      <div className="mt-[50px] mx-auto flex gap-[10px] " >
        <div className="min-w-[610px] w-full flex" > 
            <input className=" border rounded-full py-4 px-8  outline-none w-full placeholder:text-primary/50 border-secondary " type="email" placeholder="Enter your email address"   />
        </div>

      <CustomButton className="uppercase cursor-pointer text-[20px] font-medium px-[44px] py-[15px]  leading-[30px] bg-secondary !rounded-full text-white" >
        Subscribe
      </CustomButton>
      </div>
    </div>
  );
};

export default ContactUs;
