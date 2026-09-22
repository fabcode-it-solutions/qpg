import FeaturedCard from "@/components/homepage/FeaturedCard";
import React from "react";

const Featured = () => {
  const featuredContent = [
    {
      imgSrc: "/images/featured/1.png",
      number: 35,
      description: "AWARDED LICENSES IN FOURTEEN STATES",
    },
    {
      imgSrc: "/images/featured/4.png",
      number: 550,
      description: "THOUSAND FT2 OF CULTIVATION SPACE BUILT",
    },
    {
      imgSrc: "/images/featured/2.png",
      number: 55,
      description: (
        <div>
          TONS OD SOILS
          <br /> PRODUCED
        </div>
      ),
    },
    {
      imgSrc: "/images/featured/3.png",
      number: 99,
      description: (
        <div>
          PERCENT GROWTH IN <br /> THE LAST TWO YEARS
        </div>
      ),
    },
  ];
  return (
    <div className="py-[25px] flex   bg-secondary">
      <div className="max-w-[1920px] w-full mx-auto flex">
        {featuredContent.map((item, index) => (
          <div
            key={index}
            className={`flex-1 ${
              index < featuredContent.length - 1 ? "border-r border-white" : ""
            }`}
          >
            <FeaturedCard
              imgSrc={item.imgSrc}
              number={item.number}
              description={item.description}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Featured;
