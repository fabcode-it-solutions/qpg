import Image from "next/image";
import React from "react";

const OwnProduction = () => {
  return (
    <div className="py-[100px] font-[inter]">
      <div className="font-bold text-[60px] flex justify-center relative ">
        Own Production
        <div className="w-[340px] absolute bottom-0 h-[1px] bg-secondary " />
      </div>

      <div className="flex max-w-[1700px] mt-[51px] mx-auto gap-5">
        <div className="rounded-[20px] max-h-[800px] max-w-[834px] overflow-hidden ">
          <Image src="/images/our-production/1.jpg" height={800} width={834} className="h-full object-cover w-full" alt="own production image 1" />
        </div>
        <div className="flex flex-col gap-5">
          <div className="rounded-[20px] max-h-[380px] max-w-[] overflow-hidden ">
          <Image src="/images/our-production/2.jpg" height={380} width={846} className="h-full object-cover w-full" alt="own production image 1" />

          </div>
          <div className="flex gap-5 ">
         
            <div className="rounded-[20px] min-h-[400px]  max-w-[413px] overflow-hidden " > <Image src="/images/our-production/3.jpg" height={400} width={413} className="h-full object-cover w-full" alt="own production image 1" />  </div>
        
            <div className="rounded-[20px] min-h-[400px]  max-w-[413px] overflow-hidden ">
                <Image src="/images/our-production/4.jpg" height={400} width={413} className="h-full object-cover w-full" alt="own production image 1" /> </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnProduction;
