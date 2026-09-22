"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow ,Navigation} from "swiper/modules";
import 'swiper/css';
// import 'swiper/css/navigation';
import 'swiper/css/pagination';
import "swiper/css/effect-coverflow";
import Image from "next/image";


const OurHome = () => {


  const slides = [
    { id: 1, content: "/images/our-home/1.jpg" },
    { id: 2, content: "/images/our-home/2.jpg" },
    { id: 3, content: "/images/our-home/3.jpg" },
    { id: 4, content: "/images/our-home/4.jpg" },
    { id: 5, content: "/images/our-home/5.jpg" },
     { id: 6, content: "/images/our-home/1.jpg" },
    { id: 7, content: "/images/our-home/2.jpg" },
    { id: 8, content: "/images/our-home/3.jpg" },
    { id: 9, content: "/images/our-home/4.jpg" },
    { id: 10, content: "/images/our-home/5.jpg" },
  ];



  return (
    <div className="w-full relative max-h-[700px] py-[45px] overflow-hidden flex flex-col justify-start items-center mx-auto px-4">
      {/* Title */}
      <div className="text-white text-[60px] font-bold leading-[60px] z-10">
        Our Videos
      </div>

      {/* Background */}
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

      {/* Swiper Carousel */}
   <div className="relative w-full max-w-[1830px] mx-auto" >
       <Swiper
        effect="coverflow"
        grabCursor
        slidesPerView={5}
        // slidesPerGroup={5}
        loop={true}
        centeredSlides={true}

        coverflowEffect={{
          rotate: 0,
          stretch: -65,
          slideShadows: false,
        }}
        spaceBetween={28}
        modules={[EffectCoverflow,Navigation]}
        // breakpoints={{
        //   640: { spaceBetween: 20 },
        //   1024: { spaceBetween: 30 },
        // }}
        navigation={{
                      nextEl: '.swiper-button-next',
                      prevEl: '.swiper-button-prev',
                    }}
        className="w-full flex !overflow-hidden justify-center mx-auto max-w-[1710px] mt-[50px] our-home-swiper"
      >
        {/* Slides */}
        {slides.map((slide) => (
          <SwiperSlide
            key={slide.id}
            className="bg-white  rounded-[20px] overflow-hidden flex items-center justify-center transition-all duration-300"
          >
            <div className="!w-[320px] !h-[500px] relative rounded-lg flex items-center justify-center text-white text-2xl font-bold">
              <div className="!w-[320px] h-full" >
                <Image
                src={slide.content}
                className="object-cover w-full h-full  "
                alt="slider-image"
                height={1500}
                width={960}
              />
              </div>
              <div className="absolute inset-0 w-full h-full bg-[#00172F4D] opacity-70 z-0"></div>
              <div className="absolute">
                <Image
                  src={"/images/our-home/play-button.png"}
                  alt="play button"
                  height={50}
                  width={50}
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
       
      </Swiper>

      {/* Navigation Buttons */}
       <div
        // onClick={handlePrev}
        className="swiper-button-prev  z-[9999] absolute left-2 top-1/2 backdrop-blur-sm rounded-full !flex items-center justify-center cursor-pointer transition-all duration-300 -translate-y-1/2 "
      >
        <Image
          alt="prev button"
          className="rotate-180"
          width={50}
          height={50}
          src={"/images/our-home/sliderIcon.png"}
        />
      </div>
      <div
        // onClick={handleNext}
        className="absolute swiper-button-next  z-[9999] right-2 top-1/2 backdrop-blur-sm rounded-full !flex items-center justify-center cursor-pointer transition-all duration-300 -translate-y-1/2 "
      >
        <Image
          alt="next button"
          width={50}
          height={50}
          src={"/images/our-home/sliderIcon.png"}
        />
      </div>
   </div>
    </div>
  );
};

export default OurHome;
