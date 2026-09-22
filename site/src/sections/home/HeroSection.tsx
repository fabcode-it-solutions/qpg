import CustomButton from "@/components/common/CustomButton";
import Image from "next/image";
import React from "react";

const HeroSection = () => {
  return (
    <div>
      <div className=" max-h-[800px] overflow-hidden flex items-center  relative object-cover">
        <Image
          height={800}
          width={1920}
          alt="hero banner image"
          src={"/images/heroBanner.jpg"}
          className="w-full"
        />

        <div className="absolute hidden md:flex flex-col w-full top-[40%] lg:top-[26%] left-0 pl-[30px] xl:pl-[110px] ">
          <div className="flex max-w-[1920px] w-full mx-auto flex-col">
            <div className="uppercase text-2xl lg:text-[40px] xl:text-[60px] max-w-[300px] lg:max-w-[400px] xl:max-w-[600px] xl:leading-[73px] font-bold text-white">
              WE HELP CANNABIS BUSINESS GROW
            </div>
            <div className="h-[1px] my-3 lg:my-[15px] bg-secondary w-full max-w-[250px] lg:max-w-[501px]" />
            <div className="text-white lg:font-medium   max-w-[400px] lg:max-w-[500px] w-full text-sm lg:text-lg xl:text-xl leading-5 lg:leading-[30px] ">
              Click the option below which describes the status of your cannabis
              business, and see how our team
              <br />
              can be a valuable support to your success.
            </div>

            <CustomButton
              as="a"
              href="/courses"
              className=" text-sm md:text-md xl:text-xl w-min mt-5 xl:mt-[40px] text-nowrap text-white leading-6 font-medium px-5 xl:px-[39px] py-2 xl:py-[13px] uppercase !rounded-[50px] bg-secondary"
            >
              More Info
            </CustomButton>
          </div>
        </div>
      </div>

      <div className="flex md:hidden max-w-[1920px]  bg-secondary text-white py-5 w-full items-center mx-auto flex-col">
        <div className="uppercase text-2xl text-center lg:text-[40px] xl:text-[60px]  lg:max-w-[400px] xl:max-w-[600px] xl:leading-[73px] font-bold ">
          WE HELP CANNABIS BUSINESS GROW
        </div>
        <div className="h-[1px] my-3 lg:my-[15px] px-4 bg-white w-full max-w-[350px]" />
        <div className=" lg:font-medium  text-center px-4  max-w-[400px] lg:max-w-[500px] w-full text-sm lg:text-lg xl:text-xl leading-5 lg:leading-[30px] ">
          Click the option below which describes the status of your cannabis
          business, and see how our team can be a valuable support to your
          success.
        </div>

        <CustomButton
          as="a"
          href="/"
          className=" text-sm md:text-md xl:text-xl w-min mt-5 xl:mt-[40px] text-nowrap text-secondary leading-6 font-medium px-5 xl:px-[39px] py-2 xl:py-[13px] uppercase !rounded-[50px] bg-white"
        >
          More Info
        </CustomButton>
      </div>
    </div>
  );
};

export default HeroSection;
