import { BlogCardType } from "@/types/global";
import Image from "next/image";
import React from "react";

const BlogCard = ({
  imgSrc,
  date,
  tags,
  description,
  messageNumber,
}: BlogCardType) => {
  return (
    <div className="flex flex-col max-w-[550px]  ">
      <div className="rounded-[20px] relative overflow-hidden">
        <div className=" max-h-[400px] ">
          <Image
            src={imgSrc}
            alt="Blog image"
            className="w-full object-cover h-full "
            height={400}
            width={550}
          />
        </div>

        <div className="absolute bottom-0 w-full text-lg leading-[22px] font-bold  px-6 py-[10px] flex  items-center justify-between bg-secondary text-white ">
          {date}{" "}
          <div className="w-[40px] h-[40px]">
            <Image
              src={"/images/arrowIcon.png"}
              className="w-full h-full"
              alt="arrow icon"
              width={40}
              height={40}
            />
          </div>
        </div>
      </div>

      <div className=" text-primary/70 mt-5 font-medium  leading-10 text-[24px] ">
        {description}
      </div>

      <div className="w-full mt-[25px] mb-5 h-[1px] bg-primary/50 opacity-50" />

      <div className=" flex justify-between items-center mt-5 ">
        {tags?.map((item, index) => (
          <div
            className="bg-secondary cursor-pointer leading-[24px] text-white px-[35px] py-[13px] rounded-full text-[20px] capitalize"
            key={index}
          >
            {item}
          </div>
        ))}

        <div className="flex text-black/30 gap-[5px]">
          <div className="w-[30px] h-[30px] ">
            <Image
              src={"/images/image 4.png"}
              alt="msg icon"
              height={30}
              className="object-cover w-full h-full"
              width={30}
            />
          </div>
          {messageNumber}{" "}
        </div>
      </div>

      
    </div>
  );
};

export default BlogCard;
