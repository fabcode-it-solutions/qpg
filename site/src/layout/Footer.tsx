import Image from "next/image";
import Link from "next/link";
import React from "react";

const Footer = () => {
  const footerLinks = [
    {
      title: "Business",
      links: [
        {
          to: "/",
          title: " Our Process",
        },
        {
          to: "/",
          title: "Special Offers",
        },
        {
          to: "/",
          title: "Regulations",
        },
      ],
    },

    {
      title: "About Us",
      links: [
        {
          to: "/",
          title: "About Us",
        },
        {
          to: "/",
          title: "Our Team",
        },
        {
          to: "/",
          title: "Contact",
        },
      ],
    },

    {
      title: "Customer Service",
      links: [
        {
          to: "/",
          title: "Services",
        },
        {
          to: "/",
          title: "Single Service",
        },
        {
          to: "/",
          title: "Get Quote",
        },
      ],
    },
    {
      title: "Contact with Us",
      links: [
        {
          to: "/",
          title: "Instagram",
        },
        {
          to: "/",
          title: "Facebook",
        },
        {
          to: "/",
          title: "Twitter",
        },
      ],
    },
  ];

  return (
    <div className="relative min-h-[500px]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 w-full h-full bg-[#1E7A37] opacity-80 z-0"></div>
        <Image
          src={"/images/our-home/backgroundImage.jpg"}
          width={1920}
          height={700}
          alt="background image"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-[1700px] pt-[88px] flex-col font-[inter] text-white justify-between flex mx-auto w-full ">
        <div className="flex justify-between" >
          <div className="flex flex-col">
          <Image
            alt="Company logo "
            className="z-10 flex relative"
            width={109}
            height={109}
            src={"/images/footer-logo.png"}
          />

          <div className="flex z-10 gap-[14.8px] pt-[30px]">
            <Link href={"/"}>
              <Image
                alt="Facebook Icon"
                src={"/images/footer/Facebook.png"}
                height={36}
                width={36}
                className=""
              />
            </Link>
            <Link href={"/"}>
              <Image
                alt="Instagram Icon"
                src={"/images/footer/Instagram.png"}
                height={36}
                width={36}
                className=""
              />
            </Link>
            <Link href={"/"}>
              <Image
                alt="Twitter Icon"
                src={"/images/footer/Twiiter.png"}
                height={36}
                width={36}
                className=""
              />
            </Link>
          </div>
        </div>

        {footerLinks?.map((item,index) => (
          <div key={index} className="flex flex-col gap-[30px] z-10">
            <div className="font-semibold leading-[29px] uppercase text-2xl">
              {item?.title}
            </div>
            <div className="flex gap-5 flex-col">
              {item?.links?.map((item,index) => (
                <Link
                key={index}
                  href={item?.to}
                  className="leading-[27px] text-lg foont-medium "
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        ))}

        </div>

        <div className="mt-[100px]" >

<div className="w-full h-[1px] relative bg-white z-10" />

<div className="flex justify-center text-white relative z-10 mt-[45px] text-2xl" >
  All rights reserved {new Date().getFullYear()}.
</div>
        </div>
        
      </div>
    </div>
  );
};

export default Footer;
